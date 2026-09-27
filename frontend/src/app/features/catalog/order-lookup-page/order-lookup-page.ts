import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  ORDER_REQUEST_STATUS_LABELS,
  ORDER_REQUEST_TYPE_LABELS,
  PublicOrderRequestInfo,
} from '../../../core/models/order-request.model';
import { DELIVERY_METHOD_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '../../../core/models/sale.model';
import { OrderRequestService } from '../../../core/services/order-request.service';
import { resolveImageUrl } from '../../../core/utils/image-url';

/**
 * "Buscar mi pedido" (Fase 47) — autoservicio para un visitante que compró sin cuenta
 * (checkout del catálogo, Fase 18): antes no tenía forma de consultar el estado de su
 * pedido sin escribirle a la tienda por WhatsApp. Pide el número de pedido (el mismo
 * "#123" que el checkout ya le mostró al confirmar) + su propio teléfono — ambos deben
 * coincidir (ver OrderRequestService.findPublicByIdAndPhone, backend).
 */
@Component({
  selector: 'app-order-lookup-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './order-lookup-page.html',
  styleUrl: './order-lookup-page.scss',
})
export class OrderLookupPage {
  private readonly fb = inject(FormBuilder);
  private readonly orderRequestService = inject(OrderRequestService);

  readonly resolveImageUrl = resolveImageUrl;
  readonly statusLabels = ORDER_REQUEST_STATUS_LABELS;
  readonly typeLabels = ORDER_REQUEST_TYPE_LABELS;
  readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;
  readonly deliveryMethodLabels = DELIVERY_METHOD_LABELS;
  readonly paymentStatusLabels = PAYMENT_STATUS_LABELS;

  readonly form = this.fb.group({
    orderId: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    phone: ['', [Validators.required, Validators.maxLength(30)]],
  });

  readonly loading = signal(false);
  readonly notFound = signal(false);
  readonly result = signal<PublicOrderRequestInfo | null>(null);

  search(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.notFound.set(false);
    this.result.set(null);
    const { orderId, phone } = this.form.getRawValue();
    this.orderRequestService.lookup(Number(orderId), phone!.trim()).subscribe({
      next: (res) => {
        this.result.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  searchAgain(): void {
    this.result.set(null);
    this.notFound.set(false);
  }
}
