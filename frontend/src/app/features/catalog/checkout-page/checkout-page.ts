import { Component, OnInit, Renderer2, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, map } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import KRGlue from '@lyracom/embedded-form-glue';
import { PERU_DEPARTMENTS } from '../../../core/constants/peru-departments';
import { DELIVERY_METHOD_LABELS, DeliveryMethod, PAYMENT_METHOD_LABELS, PaymentMethod } from '../../../core/models/sale.model';
import { OrderRequest, OrderRequestSubmission } from '../../../core/models/order-request.model';
import { CartLine } from '../../../core/models/cart.model';
import { DeliveryAgency } from '../../../core/models/delivery-agency.model';
import { CartService } from '../../../core/services/cart.service';
import { OrderRequestService } from '../../../core/services/order-request.service';
import { PaymentService } from '../../../core/services/payment.service';
import { PublicCatalogService } from '../../../core/services/public-catalog.service';
import { whatsAppLink } from '../../../core/utils/whatsapp';

/** Dominio estático de Izipay/Lyra que sirve el JS/CSS del widget embebido — mismo dominio para
 *  sandbox y producción, solo las credenciales cambian (ver IzipayProperties en el backend). */
const IZIPAY_STATIC_ENDPOINT = 'https://static.micuentaweb.pe';

/**
 * Métodos de pago que abren el formulario de pago en línea de Izipay. Hoy solo TARJETA:
 * se verificó contra la API real (decodificando el formToken que devuelve Izipay) que
 * esta cuenta tiene habilitadas ÚNICAMENTE tarjetas — `categories.debitCreditCards`
 * con VISA/MASTERCARD/AMEX/DINERS, y ni rastro de Yape. Ofrecer el widget a quien elige
 * "Yape" le mostraría un formulario de tarjeta, que es peor que no ofrecerlo.
 *
 * Cuando Izipay active Yape en la cuenta (trámite comercial, no de código), basta agregar
 * 'YAPE' a esta lista: el mismo widget muestra los métodos que la cuenta tenga habilitados.
 */
const ONLINE_PAYMENT_METHODS: PaymentMethod[] = ['TARJETA'];

type OnlinePayStage = 'idle' | 'starting' | 'widget' | 'confirming' | 'confirmed' | 'failed' | 'delayed' | 'unavailable';

const MAX_POLL_ATTEMPTS = 15; // ~30s a 2s de intervalo, esperando la confirmación IPN

/**
 * Checkout del catálogo público (sin login, Fase 18), rediseñado en 3 pasos (Fase 55, pedido
 * explícito del dueño: "lo más sencillo y seguro para el cliente"). Cada paso es un `FormGroup`
 * anidado (`customer`/`shipping`/`payment`) — es el patrón estándar de Angular Material para que
 * `mat-stepper` sepa, paso por paso, si puede dejar avanzar (`[stepControl]`) sin tener que
 * validar el formulario completo de una sola vez como antes:
 *   1. "Tus datos" — nombre, teléfono, WhatsApp.
 *   2. "Envío" — tipo de entrega y los campos que correspondan según el tipo (Fase 18, sin cambios
 *      de reglas: PICKUP no pide nada más, DELIVERY pide dirección+distrito, AGENCY pide agencia
 *      + datos de quien recoge).
 *   3. "Pago" — un resumen de todo lo ya ingresado (para que el cliente lo revise antes de pagar,
 *      la parte de "seguro" del pedido) + método de pago + el envío final, que dispara exactamente
 *      el mismo flujo de siempre (pedido pendiente / pago en línea con Izipay / Yape con
 *      comprobante) — nada de esa lógica cambió, solo dónde vive dentro de la pantalla.
 *
 * Envía el pedido como una "solicitud pendiente" (OrderRequestService.submit) — NO es una venta
 * real todavía, el admin la revisa en Pedidos → "Pedidos web", SALVO que el cliente elija un
 * método de ONLINE_PAYMENT_METHODS (hoy, tarjeta): ahí se paga en línea de inmediato con Izipay
 * dentro de esta misma página y, apenas Izipay confirma el pago por IPN al backend, el pedido se
 * convierte solo en una venta real (ver IzipayService.handleIpn).
 *
 * El carrito puede traer productos en stock y en preventa mezclados (el bloqueo de CartService se
 * quitó): acá se separan en 2 `submit()` distintos (uno homogéneo STOCK, otro homogéneo PREORDER —
 * el backend nunca acepta un pedido mixto) para que cada uno se convierta después por su cuenta:
 * STOCK en una venta, PREORDER en reserva(s) — ver "Pedidos web" en el admin. El pago en línea
 * solo se ofrece cuando hay un único pedido 100% en stock; un carrito mixto o 100% preventa
 * siempre cae al flujo de WhatsApp.
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
    MatStepperModule,
  ],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
})
export class CheckoutPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly renderer = inject(Renderer2);
  private readonly breakpointObserver = inject(BreakpointObserver);
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
  /** Uno o dos pedidos (carrito mixto se separa en STOCK + PREORDER) — ver submit(). */
  readonly submittedOrders = signal<OrderRequest[]>([]);
  readonly whatsAppUrl = signal<string | null>(null);
  readonly storeHasWhatsapp = signal(true);

  readonly payStage = signal<OnlinePayStage>('idle');
  readonly payErrorMessage = signal<string | null>(null);
  readonly convertedSaleId = signal<number | null>(null);
  private themeAssetsLoaded = false;
  private pollAttempts = 0;

  /**
   * Pestaña de WhatsApp abierta EN BLANCO en el propio clic de "Confirmar y enviar pedido"
   * (Fase 57, pedido explícito del dueño: "que lo haga cuando envía su pedido", sin que el
   * cliente tenga que apretar un segundo botón). Los navegadores bloquean un `window.open()`
   * disparado después de una llamada HTTP asíncrona (ya no cuenta como gesto directo del
   * usuario) — pero SÍ permiten uno disparado de forma síncrona dentro del propio evento de
   * clic, aunque todavía no se sepa la URL final. El truco estándar: abrir la pestaña en blanco
   * ahí mismo, guardar la referencia, y recién navegarla a la URL real de WhatsApp cuando
   * `buildWhatsAppLink()` la termine de armar (después de crear el pedido y consultar
   * `getStoreInfo()`). El botón visible "Enviar por WhatsApp" de la plantilla se conserva como
   * respaldo manual, por si el navegador bloqueó igual el truco o el cliente cerró la pestaña.
   */
  private pendingWaWindow: Window | null = null;

  readonly showPayWidget = computed(() => {
    const method = this.submittedOrder()?.preferredPaymentMethod;
    return (
      !!method &&
      ONLINE_PAYMENT_METHODS.includes(method) &&
      ['starting', 'widget', 'confirming', 'failed', 'delayed'].includes(this.payStage())
    );
  });
  readonly showPaySuccess = computed(() => this.payStage() === 'confirmed');

  // Pago con Yape por comprobante (Fase 52) — se muestra en la pantalla de confirmación
  // cuando el cliente eligió Yape y la tienda tiene un número configurado.
  readonly yapeNumber = signal<string | null>(null);
  readonly yapeHolderName = signal<string | null>(null);
  readonly voucherUploading = signal(false);
  readonly voucherUploaded = signal(false);
  readonly voucherError = signal<string | null>(null);
  readonly showYapeBox = computed(() => {
    const orders = this.submittedOrders();
    // Solo con UN pedido: un carrito mixto genera dos y el monto a yapear sería ambiguo.
    return orders.length === 1 && orders[0].preferredPaymentMethod === 'YAPE' && !!this.yapeNumber();
  });

  /**
   * Debajo de este ancho el stepper pasa de horizontal (pestañas arriba, como pidió el dueño)
   * a vertical (los 3 pasos apilados) — horizontal con 3 encabezados + texto no entra cómodo en
   * un teléfono angosto sin recortarse, mismo criterio de breakpoint que el resto del catálogo
   * (ver `isMobileFilters` en catalog-home.ts).
   */
  readonly isMobile = toSignal(this.breakpointObserver.observe('(max-width: 640px)').pipe(map((r) => r.matches)), {
    initialValue: false,
  });
  readonly stepperOrientation = computed<'horizontal' | 'vertical'>(() => (this.isMobile() ? 'vertical' : 'horizontal'));

  /**
   * 3 pasos = 3 FormGroup anidados: es lo que permite que `mat-stepper` valide cada paso por
   * separado (`[stepControl]`) en vez de tener que revisar el formulario completo de una sola vez.
   */
  readonly form = this.fb.group({
    customer: this.fb.group({
      guestName: ['', [Validators.required, Validators.maxLength(200)]],
      guestPhone: ['', [Validators.required, Validators.maxLength(30)]],
      guestWhatsapp: ['', Validators.maxLength(30)],
    }),
    shipping: this.fb.group({
      deliveryMethod: ['PICKUP' as DeliveryMethod, Validators.required],
      guestAddress: ['', Validators.maxLength(255)],
      guestDistrict: ['', Validators.maxLength(100)],
      guestProvince: ['', Validators.maxLength(100)],
      guestDepartment: [null as string | null],
      deliveryAgencyId: [null as number | null],
      recipientDni: ['', Validators.maxLength(20)],
      recipientName: ['', Validators.maxLength(200)],
      recipientPhone: ['', Validators.maxLength(30)],
    }),
    payment: this.fb.group({
      preferredPaymentMethod: ['YAPE' as PaymentMethod, Validators.required],
      notes: ['', Validators.maxLength(500)],
    }),
  });

  /** PICKUP no pide ubicación; DELIVERY pide dirección+distrito; AGENCY pide agencia+destinatario. */
  readonly locationMode = computed<'none' | 'address' | 'agency'>(() => {
    const method = this.deliveryMethodValue();
    if (method === 'DELIVERY') return 'address';
    if (method === 'AGENCY') return 'agency';
    return 'none';
  });
  private readonly deliveryMethodValue = signal<DeliveryMethod>('PICKUP');
  /** Etiqueta del tipo de entrega elegido, para el repaso del paso 3 — nunca se indexa el
   * Record directamente en el template (dispara TS7053 bajo chequeo estricto de plantillas). */
  readonly deliveryMethodLabel = computed(() => DELIVERY_METHOD_LABELS[this.deliveryMethodValue()]);
  readonly selectedPaymentMethod = signal<PaymentMethod>('YAPE');
  /** Si el método elegido se cobra en línea acá mismo (ver ONLINE_PAYMENT_METHODS) o se coordina por WhatsApp. */
  readonly paysOnline = computed(() => ONLINE_PAYMENT_METHODS.includes(this.selectedPaymentMethod()));
  readonly deliveryAgencies = signal<DeliveryAgency[]>([]);
  readonly departments = PERU_DEPARTMENTS;

  /** Recuadro de repaso en el paso 3 ("revisa antes de pagar") — nombre de la agencia elegida. */
  readonly selectedAgencyName = computed(() => {
    const id = this.form.controls.shipping.controls.deliveryAgencyId.value;
    return this.deliveryAgencies().find((a) => a.id === id)?.name ?? null;
  });

  ngOnInit(): void {
    if (this.lines().length === 0) {
      this.router.navigate(['/catalogo/carrito']);
      return;
    }
    this.catalogService.getDeliveryAgencies().subscribe({
      next: (res) => this.deliveryAgencies.set(res.data),
      error: () => this.deliveryAgencies.set([]),
    });
    this.form.controls.shipping.controls.deliveryMethod.valueChanges.subscribe((value) => {
      this.deliveryMethodValue.set(value as DeliveryMethod);
      this.applyLocationValidators(value as DeliveryMethod);
    });
    this.form.controls.payment.controls.preferredPaymentMethod.valueChanges.subscribe((value) => {
      this.selectedPaymentMethod.set(value as PaymentMethod);
    });
  }

  private applyLocationValidators(method: DeliveryMethod): void {
    const shipping = this.form.controls.shipping.controls;
    const { guestAddress: address, guestDistrict: district, guestProvince: province, guestDepartment: department } = shipping;
    const { deliveryAgencyId: agencyId, recipientDni: dni, recipientName, recipientPhone } = shipping;

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
    const buildRequest = (lines: CartLine[]): OrderRequestSubmission => ({
      guestName: v.customer.guestName!,
      guestPhone: v.customer.guestPhone!,
      guestWhatsapp: v.customer.guestWhatsapp || null,
      guestAddress: v.shipping.guestAddress || null,
      guestDistrict: v.shipping.guestDistrict || null,
      guestProvince: v.shipping.guestProvince || null,
      guestDepartment: v.shipping.guestDepartment || null,
      preferredPaymentMethod: v.payment.preferredPaymentMethod as PaymentMethod,
      deliveryMethod: v.shipping.deliveryMethod as DeliveryMethod,
      deliveryAgencyId: v.shipping.deliveryAgencyId || null,
      recipientDni: v.shipping.recipientDni || null,
      recipientName: v.shipping.recipientName || null,
      recipientPhone: v.shipping.recipientPhone || null,
      notes: v.payment.notes || null,
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    });

    const stockLines = this.lines().filter((l) => !l.isPreorder);
    const preorderLines = this.lines().filter((l) => l.isPreorder);
    const isMixedCart = stockLines.length > 0 && preorderLines.length > 0;
    // Mismo cálculo que decide, más abajo, si el pedido cae al pago en línea o al flujo de
    // WhatsApp — calculado ACÁ (síncrono, con lo que ya hay en el carrito) para saber, en el
    // instante mismo del clic, si hace falta reservar la pestaña en blanco. Un carrito mixto
    // siempre cae a WhatsApp; uno homogéneo cae a WhatsApp salvo que sea 100% stock y el
    // método elegido esté en ONLINE_PAYMENT_METHODS.
    const willUseWhatsApp = isMixedCart || !(stockLines.length === this.lines().length && this.paysOnline());
    if (willUseWhatsApp) {
      this.pendingWaWindow = window.open('', '_blank');
    }

    this.saving.set(true);
    if (isMixedCart) {
      // Carrito mixto: el backend nunca acepta un pedido con ambos tipos — se envían
      // como 2 pedidos web separados. Sin pago en línea acá (solo aplica a un pedido
      // 100% en stock): ambos quedan pendientes y se coordina todo por WhatsApp.
      forkJoin([this.orderRequestService.submit(buildRequest(stockLines)), this.orderRequestService.submit(buildRequest(preorderLines))]).subscribe({
        next: ([stockRes, preorderRes]) => {
          this.saving.set(false);
          this.submittedOrders.set([stockRes.data, preorderRes.data]);
          this.cartService.clear();
          this.buildWhatsAppLink([stockRes.data, preorderRes.data]);
        },
        error: () => {
          this.saving.set(false);
          this.closePendingWaWindow();
        },
      });
    } else {
      this.orderRequestService.submit(buildRequest(this.lines())).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.submittedOrders.set([res.data]);
          this.cartService.clear();
          if (ONLINE_PAYMENT_METHODS.includes(res.data.preferredPaymentMethod) && res.data.requestType === 'STOCK') {
            this.submittedOrder.set(res.data);
            this.closePendingWaWindow(); // este camino no usa WhatsApp — se abre el widget de pago en línea
            this.startOnlinePayment(res.data);
          } else {
            this.buildWhatsAppLink([res.data]);
          }
        },
        error: () => {
          this.saving.set(false);
          this.closePendingWaWindow();
        },
      });
    }
  }

  /** Cierra y limpia la pestaña reservada en `submit()` si al final no hizo falta (pedido
   * fallido, o resultó yendo por el pago en línea en vez de WhatsApp). */
  private closePendingWaWindow(): void {
    if (this.pendingWaWindow && !this.pendingWaWindow.closed) {
      this.pendingWaWindow.close();
    }
    this.pendingWaWindow = null;
  }

  /** El cliente eligió pagar por otro medio en vez de esperar/reintentar el pago en línea. */
  retryWithWhatsApp(): void {
    const order = this.submittedOrder();
    if (!order) return;
    this.payStage.set('unavailable');
    this.buildWhatsAppLink([order]);
  }

  private startOnlinePayment(order: OrderRequest): void {
    this.payStage.set('starting');
    this.paymentService.createFormToken(order.id).subscribe({
      next: (res) => {
        this.payStage.set('widget');
        // El contenedor #kr-payment-form recién existe en el DOM tras el cambio de señal de arriba.
        setTimeout(() => this.loadKryptonWidget(res.data.formToken, res.data.publicKey), 0);
      },
      error: () => {
        // El pago en línea no está disponible (ej. Izipay sin configurar, o este pedido es de
        // preventa — ver IzipayService.createFormToken) — caemos sin fricción al flujo de
        // siempre: declarar preferencia y coordinar por WhatsApp.
        this.payStage.set('unavailable');
        this.buildWhatsAppLink([order]);
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
        this.handlePaySubmit(response.rawClientAnswer, response.hash, response.clientAnswer?.orderStatus);
        return false; // controlamos nosotros la pantalla de resultado, no dejamos que el widget redirija
      });
    } catch {
      this.payStage.set('unavailable');
      const order = this.submittedOrder();
      if (order) this.buildWhatsAppLink([order]);
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

  private handlePaySubmit(krAnswer: string, krHash: string, orderStatus: string | undefined): void {
    this.payStage.set('confirming');
    this.paymentService.validate(krAnswer, krHash).subscribe({
      next: (res) => {
        if (!res.data || orderStatus !== 'PAID') {
          this.payStage.set('failed');
          this.payErrorMessage.set(
            'El pago no se pudo completar. Puedes intentarlo de nuevo o coordinar el pago por WhatsApp.',
          );
          return;
        }
        this.pollAttempts = 0;
        this.pollOrderStatus();
      },
      error: () => {
        this.payStage.set('failed');
        this.payErrorMessage.set(
          'No se pudo verificar el pago. Si ya te hicieron el cobro, escríbenos por WhatsApp.',
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
          this.payStage.set('confirmed');
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
      this.payStage.set('delayed');
      this.buildWhatsAppLink([order]);
      return;
    }
    setTimeout(() => this.pollOrderStatus(), 2000);
  }

  copyYapeNumber(): void {
    const number = this.yapeNumber();
    if (number) navigator.clipboard?.writeText(number);
  }

  /** El cliente sube la captura de su pago con Yape (Fase 52). */
  onVoucherSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const order = this.submittedOrders()[0];
    if (!file || !order) return;

    this.voucherUploading.set(true);
    this.voucherError.set(null);
    const phone = this.form.controls.customer.controls.guestPhone.value ?? '';
    this.orderRequestService.uploadVoucher(order.id, phone, file).subscribe({
      next: () => {
        this.voucherUploading.set(false);
        this.voucherUploaded.set(true);
      },
      error: () => {
        this.voucherUploading.set(false);
        this.voucherError.set('No se pudo subir la captura. Intenta de nuevo o envíanosla por WhatsApp.');
      },
    });
    input.value = ''; // permite volver a elegir el mismo archivo si falló
  }

  /** Uno o dos pedidos (carrito mixto, ver submit()) en un solo mensaje de WhatsApp. */
  private buildWhatsAppLink(orders: OrderRequest[]): void {
    this.catalogService.getStoreInfo().subscribe({
      next: (res) => {
        this.yapeNumber.set(res.data.yapeNumber);
        this.yapeHolderName.set(res.data.yapeHolderName);
        if (!res.data.whatsapp) {
          this.storeHasWhatsapp.set(false);
          this.closePendingWaWindow(); // no hay a dónde navegarla
          return;
        }
        const first = orders[0];
        const multi = orders.length > 1;
        const idsLabel = orders.map((o) => '#' + o.id).join(' y ');
        const total = orders.reduce((sum, o) => sum + o.total, 0);
        const sections = orders
          .map((o) => {
            const lines = o.items.map((i) => `- ${i.quantity}x ${i.productName} — S/ ${i.subtotal.toFixed(2)}`).join('\n');
            const header = multi ? `${o.requestType === 'PREORDER' ? 'Preventa' : 'En stock'} (#${o.id}):\n` : '';
            return header + lines;
          })
          .join('\n\n');
        let message =
          `Hola, quiero confirmar mi pedido web ${idsLabel}:\n\n${sections}\n\n` +
          `Total: S/ ${total.toFixed(2)}\n` +
          `Pago preferido: ${PAYMENT_METHOD_LABELS[first.preferredPaymentMethod]}\n` +
          `Entrega: ${DELIVERY_METHOD_LABELS[first.deliveryMethod]}\n` +
          `Nombre: ${first.guestName}`;
        if (first.deliveryMethod === 'AGENCY') {
          message +=
            `\n\nDatos del destinatario en la agencia:\n` +
            `Agencia: ${first.deliveryAgencyName ?? '-'}\n` +
            `DNI: ${first.recipientDni ?? '-'}\n` +
            `Nombre completo: ${first.recipientName ?? '-'}\n` +
            `Celular: ${first.recipientPhone ?? '-'}\n` +
            `Departamento - Provincia - Distrito: ${first.guestDepartment ?? '-'} - ${first.guestProvince ?? '-'} - ${first.guestDistrict ?? '-'}`;
        }
        const url = whatsAppLink(res.data.whatsapp, message);
        this.whatsAppUrl.set(url);
        // Ya hay URL real: navegar la pestaña reservada en el clic de "Confirmar y enviar
        // pedido" — si el cliente la cerró mientras tanto, o el navegador bloqueó igual el
        // truco (pasa en algunos casos, ej. Safari con configuraciones estrictas), queda el
        // botón "Enviar por WhatsApp" de la plantilla como respaldo manual.
        if (this.pendingWaWindow && !this.pendingWaWindow.closed) {
          this.pendingWaWindow.location.href = url;
        }
        this.pendingWaWindow = null;
      },
      error: () => {
        this.storeHasWhatsapp.set(false);
        this.closePendingWaWindow();
      },
    });
  }
}
