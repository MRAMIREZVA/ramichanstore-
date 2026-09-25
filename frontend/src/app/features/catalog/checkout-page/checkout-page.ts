import { Component, OnInit, Renderer2, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import KRGlue from '@lyracom/embedded-form-glue';
import { PERU_DEPARTMENTS } from '../../../core/constants/peru-departments';
import { DELIVERY_METHOD_LABELS, DeliveryMethod, PAYMENT_METHOD_LABELS, PaymentMethod } from '../../../core/models/sale.model';
import { OrderRequest, OrderRequestSubmission } from '../../../core/models/order-request.model';
import { DeliveryAgency } from '../../../core/models/delivery-agency.model';
import { CartService } from '../../../core/services/cart.service';
import { OrderRequestService } from '../../../core/services/order-request.service';
import { PaymentService } from '../../../core/services/payment.service';
import { PublicCatalogService } from '../../../core/services/public-catalog.service';
import { whatsAppLink } from '../../../core/utils/whatsapp';

/** Dominio estático de Izipay/Lyra que sirve el JS/CSS del widget embebido — mismo dominio para
 *  sandbox y producción, solo las credenciales cambian (ver IzipayProperties en el backend). */
const IZIPAY_STATIC_ENDPOINT = 'https://static.micuentaweb.pe';

type YapeStage = 'idle' | 'starting' | 'widget' | 'confirming' | 'confirmed' | 'failed' | 'delayed' | 'unavailable';

const MAX_POLL_ATTEMPTS = 15; // ~30s a 2s de intervalo, esperando la confirmación IPN

/**
 * Checkout del catálogo público (sin login, Fase 18): pide datos de contacto
 * + método de entrega + método de pago preferido y envía el pedido como una
 * "solicitud pendiente" (OrderRequestService.submit) — NO es una venta real
 * todavía, el admin la revisa en Pedidos → "Pedidos web", SALVO que el cliente
 * elija Yape (Fase 37): ahí se paga en línea de inmediato con Izipay dentro de
 * esta misma página y, apenas Izipay confirma el pago por IPN al backend, el
 * pedido se convierte solo en una venta real (ver IzipayService.handleIpn).
 */
@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
})
export class CheckoutPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly renderer = inject(Renderer2);
  private readonly cartService = inject(CartService);
  private readonly orderRequestService = inject(OrderRequestService);
  private readonly paymentService = inject(PaymentService);
  private readonly catalogService = inject(PublicCatalogService);

  readonly lines = this.cartService.lines;
  readonly totalAmount = this.cartService.totalAmount;

  readonly deliveryMethodOptions = Object.entries(DELIVERY_METHOD_LABELS) as [DeliveryMethod, string][];
  readonly paymentMethodOptions = Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][];

  readonly saving = signal(false);
  readonly submittedOrder = signal<OrderRequest | null>(null);
  readonly whatsAppUrl = signal<string | null>(null);
  readonly storeHasWhatsapp = signal(true);

  readonly yapeStage = signal<YapeStage>('idle');
  readonly yapeErrorMessage = signal<string | null>(null);
  readonly convertedSaleId = signal<number | null>(null);
  private themeAssetsLoaded = false;
  private pollAttempts = 0;

  readonly showYapeWidget = computed(() =>
    this.submittedOrder()?.preferredPaymentMethod === 'YAPE' &&
    ['starting', 'widget', 'confirming', 'failed', 'delayed'].includes(this.yapeStage()),
  );
  readonly showYapeSuccess = computed(() => this.yapeStage() === 'confirmed');

  readonly form = this.fb.group({
    guestName: ['', [Validators.required, Validators.maxLength(200)]],
    guestPhone: ['', [Validators.required, Validators.maxLength(30)]],
    guestWhatsapp: ['', Validators.maxLength(30)],
    deliveryMethod: ['PICKUP' as DeliveryMethod, Validators.required],
    guestAddress: ['', Validators.maxLength(255)],
    guestDistrict: ['', Validators.maxLength(100)],
    guestProvince: ['', Validators.maxLength(100)],
    guestDepartment: [null as string | null],
    deliveryAgencyId: [null as number | null],
    recipientDni: ['', Validators.maxLength(20)],
    recipientName: ['', Validators.maxLength(200)],
    recipientPhone: ['', Validators.maxLength(30)],
    preferredPaymentMethod: ['YAPE' as PaymentMethod, Validators.required],
    notes: ['', Validators.maxLength(500)],
  });

  /** PICKUP no pide ubicación; DELIVERY pide dirección+distrito; AGENCY pide agencia+destinatario. */
  readonly locationMode = computed<'none' | 'address' | 'agency'>(() => {
    const method = this.deliveryMethodValue();
    if (method === 'DELIVERY') return 'address';
    if (method === 'AGENCY') return 'agency';
    return 'none';
  });
  private readonly deliveryMethodValue = signal<DeliveryMethod>('PICKUP');
  readonly selectedPaymentMethod = signal<PaymentMethod>('YAPE');
  readonly deliveryAgencies = signal<DeliveryAgency[]>([]);
  readonly departments = PERU_DEPARTMENTS;

  ngOnInit(): void {
    if (this.lines().length === 0) {
      this.router.navigate(['/catalogo/carrito']);
      return;
    }
    this.catalogService.getDeliveryAgencies().subscribe({
      next: (res) => this.deliveryAgencies.set(res.data),
      error: () => this.deliveryAgencies.set([]),
    });
    this.form.controls.deliveryMethod.valueChanges.subscribe((value) => {
      this.deliveryMethodValue.set(value as DeliveryMethod);
      this.applyLocationValidators(value as DeliveryMethod);
    });
    this.form.controls.preferredPaymentMethod.valueChanges.subscribe((value) => {
      this.selectedPaymentMethod.set(value as PaymentMethod);
    });
  }

  private applyLocationValidators(method: DeliveryMethod): void {
    const address = this.form.controls.guestAddress;
    const district = this.form.controls.guestDistrict;
    const province = this.form.controls.guestProvince;
    const department = this.form.controls.guestDepartment;
    const agencyId = this.form.controls.deliveryAgencyId;
    const dni = this.form.controls.recipientDni;
    const recipientName = this.form.controls.recipientName;
    const recipientPhone = this.form.controls.recipientPhone;

    address.clearValidators();
    address.addValidators(method === 'DELIVERY' ? [Validators.required, Validators.maxLength(255)] : [Validators.maxLength(255)]);

    district.clearValidators();
    district.addValidators(method !== 'PICKUP' ? [Validators.required, Validators.maxLength(100)] : [Validators.maxLength(100)]);

    const requiredIfAgency = method === 'AGENCY' ? [Validators.required] : [];
    department.setValidators(requiredIfAgency);
    province.setValidators([...requiredIfAgency, Validators.maxLength(100)]);
    agencyId.setValidators(requiredIfAgency);
    dni.setValidators([...requiredIfAgency, Validators.maxLength(20)]);
    recipientName.setValidators([...requiredIfAgency, Validators.maxLength(200)]);
    recipientPhone.setValidators([...requiredIfAgency, Validators.maxLength(30)]);

    for (const control of [address, district, department, province, agencyId, dni, recipientName, recipientPhone]) {
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const request: OrderRequestSubmission = {
      guestName: v.guestName!,
      guestPhone: v.guestPhone!,
      guestWhatsapp: v.guestWhatsapp || null,
      guestAddress: v.guestAddress || null,
      guestDistrict: v.guestDistrict || null,
      guestProvince: v.guestProvince || null,
      guestDepartment: v.guestDepartment || null,
      preferredPaymentMethod: v.preferredPaymentMethod as PaymentMethod,
      deliveryMethod: v.deliveryMethod as DeliveryMethod,
      deliveryAgencyId: v.deliveryAgencyId || null,
      recipientDni: v.recipientDni || null,
      recipientName: v.recipientName || null,
      recipientPhone: v.recipientPhone || null,
      notes: v.notes || null,
      items: this.lines().map((l) => ({ productId: l.productId, quantity: l.quantity })),
    };

    this.saving.set(true);
    this.orderRequestService.submit(request).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.submittedOrder.set(res.data);
        this.cartService.clear();
        if (res.data.preferredPaymentMethod === 'YAPE') {
          this.startYapePayment(res.data);
        } else {
          this.buildWhatsAppLink(res.data);
        }
      },
      error: () => this.saving.set(false),
    });
  }

  /** El cliente eligió pagar por otro medio en vez de esperar/reintentar el widget de Yape. */
  retryWithWhatsApp(): void {
    const order = this.submittedOrder();
    if (!order) return;
    this.yapeStage.set('unavailable');
    this.buildWhatsAppLink(order);
  }

  private startYapePayment(order: OrderRequest): void {
    this.yapeStage.set('starting');
    this.paymentService.createFormToken(order.id).subscribe({
      next: (res) => {
        this.yapeStage.set('widget');
        // El contenedor #kr-payment-form recién existe en el DOM tras el cambio de señal de arriba.
        setTimeout(() => this.loadKryptonWidget(res.data.formToken, res.data.publicKey), 0);
      },
      error: () => {
        // El pago en línea con Yape no está disponible todavía (ej. Izipay sin configurar) —
        // caemos sin fricción al flujo de siempre: declarar preferencia y coordinar por WhatsApp.
        this.yapeStage.set('unavailable');
        this.buildWhatsAppLink(order);
      },
    });
  }

  private async loadKryptonWidget(formToken: string, publicKey: string): Promise<void> {
    try {
      this.loadThemeAssets();
      const { KR } = await KRGlue.loadLibrary(IZIPAY_STATIC_ENDPOINT, publicKey, formToken);
      await KR.setFormConfig({ formToken, 'kr-language': 'es-ES' });
      await KR.renderElements('#kr-payment-form');
      await KR.onSubmit((response) => {
        this.handleYapeSubmit(response.rawClientAnswer, response.hash, response.clientAnswer?.orderStatus);
        return false; // controlamos nosotros la pantalla de resultado, no dejamos que el widget redirija
      });
    } catch {
      this.yapeStage.set('unavailable');
      const order = this.submittedOrder();
      if (order) this.buildWhatsAppLink(order);
    }
  }

  private loadThemeAssets(): void {
    if (this.themeAssetsLoaded) return;
    this.themeAssetsLoaded = true;
    const link = this.renderer.createElement('link');
    this.renderer.setAttribute(link, 'rel', 'stylesheet');
    this.renderer.setAttribute(link, 'href', `${IZIPAY_STATIC_ENDPOINT}/static/js/krypton-client/V4.0/ext/neon-reset.min.css`);
    this.renderer.appendChild(document.head, link);
    const script = this.renderer.createElement('script');
    this.renderer.setAttribute(script, 'src', `${IZIPAY_STATIC_ENDPOINT}/static/js/krypton-client/V4.0/ext/neon.js`);
    this.renderer.appendChild(document.head, script);
  }

  private handleYapeSubmit(krAnswer: string, krHash: string, orderStatus: string | undefined): void {
    this.yapeStage.set('confirming');
    this.paymentService.validate(krAnswer, krHash).subscribe({
      next: (res) => {
        if (!res.data || orderStatus !== 'PAID') {
          this.yapeStage.set('failed');
          this.yapeErrorMessage.set(
            'El pago no se pudo completar. Puedes intentarlo de nuevo o coordinar el pago por WhatsApp.',
          );
          return;
        }
        this.pollAttempts = 0;
        this.pollOrderStatus();
      },
      error: () => {
        this.yapeStage.set('failed');
        this.yapeErrorMessage.set(
          'No se pudo verificar el pago. Si Yape ya te descontó el monto, escríbenos por WhatsApp.',
        );
      },
    });
  }

  private pollOrderStatus(): void {
    const order = this.submittedOrder();
    if (!order) return;
    this.pollAttempts++;
    this.orderRequestService.getStatus(order.id).subscribe({
      next: (res) => {
        if (res.data.status === 'CONVERTED') {
          this.yapeStage.set('confirmed');
          this.convertedSaleId.set(res.data.convertedSaleId);
          return;
        }
        this.continuePollingOrGiveUp(order);
      },
      error: () => this.continuePollingOrGiveUp(order),
    });
  }

  private continuePollingOrGiveUp(order: OrderRequest): void {
    if (this.pollAttempts >= MAX_POLL_ATTEMPTS) {
      this.yapeStage.set('delayed');
      this.buildWhatsAppLink(order);
      return;
    }
    setTimeout(() => this.pollOrderStatus(), 2000);
  }

  private buildWhatsAppLink(order: OrderRequest): void {
    this.catalogService.getStoreInfo().subscribe({
      next: (res) => {
        if (!res.data.whatsapp) {
          this.storeHasWhatsapp.set(false);
          return;
        }
        const lines = order.items.map((i) => `- ${i.quantity}x ${i.productName} — S/ ${i.subtotal.toFixed(2)}`).join('\n');
        let message =
          `Hola, quiero confirmar mi pedido web #${order.id}:\n\n${lines}\n\n` +
          `Total: S/ ${order.total.toFixed(2)}\n` +
          `Pago preferido: ${PAYMENT_METHOD_LABELS[order.preferredPaymentMethod]}\n` +
          `Entrega: ${DELIVERY_METHOD_LABELS[order.deliveryMethod]}\n` +
          `Nombre: ${order.guestName}`;
        if (order.deliveryMethod === 'AGENCY') {
          message +=
            `\n\nDatos del destinatario en la agencia:\n` +
            `Agencia: ${order.deliveryAgencyName ?? '-'}\n` +
            `DNI: ${order.recipientDni ?? '-'}\n` +
            `Nombre completo: ${order.recipientName ?? '-'}\n` +
            `Celular: ${order.recipientPhone ?? '-'}\n` +
            `Departamento - Provincia - Distrito: ${order.guestDepartment ?? '-'} - ${order.guestProvince ?? '-'} - ${order.guestDistrict ?? '-'}`;
        }
        this.whatsAppUrl.set(whatsAppLink(res.data.whatsapp, message));
      },
      error: () => this.storeHasWhatsapp.set(false),
    });
  }
}
