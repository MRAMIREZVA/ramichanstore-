import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { DELIVERY_METHOD_LABELS, DeliveryMethod, PAYMENT_METHOD_LABELS, PaymentMethod } from '../../../core/models/sale.model';
import { OrderRequest, OrderRequestSubmission } from '../../../core/models/order-request.model';
import { CartService } from '../../../core/services/cart.service';
import { OrderRequestService } from '../../../core/services/order-request.service';
import { PublicCatalogService } from '../../../core/services/public-catalog.service';
import { whatsAppLink } from '../../../core/utils/whatsapp';

/**
 * Checkout del catálogo público (sin login, Fase 18): pide datos de contacto
 * + método de entrega + método de pago preferido (RamichanStore no procesa
 * pagos online — el cliente solo declara su preferencia, el pago real se
 * coordina por WhatsApp igual que hoy) y envía el pedido como una "solicitud
 * pendiente" (OrderRequestService.submit) — NO es una venta real todavía, el
 * admin la revisa en Pedidos → "Pedidos web".
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
  private readonly cartService = inject(CartService);
  private readonly orderRequestService = inject(OrderRequestService);
  private readonly catalogService = inject(PublicCatalogService);

  readonly lines = this.cartService.lines;
  readonly totalAmount = this.cartService.totalAmount;

  readonly deliveryMethodOptions = Object.entries(DELIVERY_METHOD_LABELS) as [DeliveryMethod, string][];
  readonly paymentMethodOptions = Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][];

  readonly saving = signal(false);
  readonly submittedOrder = signal<OrderRequest | null>(null);
  readonly whatsAppUrl = signal<string | null>(null);
  readonly storeHasWhatsapp = signal(true);

  readonly form = this.fb.group({
    guestName: ['', [Validators.required, Validators.maxLength(200)]],
    guestPhone: ['', [Validators.required, Validators.maxLength(30)]],
    guestWhatsapp: ['', Validators.maxLength(30)],
    deliveryMethod: ['PICKUP' as DeliveryMethod, Validators.required],
    guestAddress: ['', Validators.maxLength(255)],
    guestDistrict: ['', Validators.maxLength(100)],
    preferredPaymentMethod: ['YAPE' as PaymentMethod, Validators.required],
    notes: ['', Validators.maxLength(500)],
  });

  readonly needsAddress = computed(() => this.deliveryMethodValue() !== 'PICKUP');
  private readonly deliveryMethodValue = signal<DeliveryMethod>('PICKUP');

  ngOnInit(): void {
    if (this.lines().length === 0) {
      this.router.navigate(['/catalogo/carrito']);
      return;
    }
    this.form.controls.deliveryMethod.valueChanges.subscribe((value) => {
      this.deliveryMethodValue.set(value as DeliveryMethod);
      const addressControl = this.form.controls.guestAddress;
      const districtControl = this.form.controls.guestDistrict;
      if (value !== 'PICKUP') {
        addressControl.addValidators(Validators.required);
        districtControl.addValidators(Validators.required);
      } else {
        addressControl.clearValidators();
        addressControl.addValidators(Validators.maxLength(255));
        districtControl.clearValidators();
        districtControl.addValidators(Validators.maxLength(100));
      }
      addressControl.updateValueAndValidity({ emitEvent: false });
      districtControl.updateValueAndValidity({ emitEvent: false });
    });
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
      preferredPaymentMethod: v.preferredPaymentMethod as PaymentMethod,
      deliveryMethod: v.deliveryMethod as DeliveryMethod,
      notes: v.notes || null,
      items: this.lines().map((l) => ({ productId: l.productId, quantity: l.quantity })),
    };

    this.saving.set(true);
    this.orderRequestService.submit(request).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.submittedOrder.set(res.data);
        this.cartService.clear();
        this.buildWhatsAppLink(res.data);
      },
      error: () => this.saving.set(false),
    });
  }

  private buildWhatsAppLink(order: OrderRequest): void {
    this.catalogService.getStoreInfo().subscribe({
      next: (res) => {
        if (!res.data.whatsapp) {
          this.storeHasWhatsapp.set(false);
          return;
        }
        const lines = order.items.map((i) => `- ${i.quantity}x ${i.productName} — S/ ${i.subtotal.toFixed(2)}`).join('\n');
        const message =
          `Hola, quiero confirmar mi pedido web #${order.id}:\n\n${lines}\n\n` +
          `Total: S/ ${order.total.toFixed(2)}\n` +
          `Pago preferido: ${PAYMENT_METHOD_LABELS[order.preferredPaymentMethod]}\n` +
          `Entrega: ${DELIVERY_METHOD_LABELS[order.deliveryMethod]}\n` +
          `Nombre: ${order.guestName}`;
        this.whatsAppUrl.set(whatsAppLink(res.data.whatsapp, message));
      },
      error: () => this.storeHasWhatsapp.set(false),
    });
  }
}
