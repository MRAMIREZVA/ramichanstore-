import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  DELIVERY_METHOD_LABELS,
  DeliveryMethod,
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
} from '../../../core/models/sale.model';
import {
  ORDER_PAYMENT_STATE_LABELS,
  ORDER_REQUEST_STATUS_LABELS,
  ORDER_REQUEST_TYPE_LABELS,
  OrderRequest,
  OrderRequestStatus,
  OrderRequestType,
  orderPaymentState,
} from '../../../core/models/order-request.model';
import { OrderRequestService } from '../../../core/services/order-request.service';
import { resolveImageUrl } from '../../../core/utils/image-url';
import { whatsAppLink } from '../../../core/utils/whatsapp';
import { ImagePreviewDialogComponent } from '../../../shared/components/image-preview-dialog/image-preview-dialog';

/**
 * Detalle de un pedido web (Fase 53). Antes la lista solo decía "3 producto(s)" y no había forma
 * de ver QUÉ se pidió ni si el cliente había pagado, que eran justo las dos preguntas del dueño.
 * Es de solo lectura: convertir/rechazar siguen viviendo en la lista, donde ya estaban.
 */
@Component({
  selector: 'app-order-request-detail',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './order-request-detail.html',
  styleUrl: './order-request-detail.scss',
})
export class OrderRequestDetailComponent {
  private readonly dialogRef = inject(MatDialogRef<OrderRequestDetailComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly orderRequestService = inject(OrderRequestService);
  readonly order = inject<OrderRequest>(MAT_DIALOG_DATA);

  readonly resolveImageUrl = resolveImageUrl;
  readonly paymentState = orderPaymentState(this.order);
  readonly paymentStateLabel = ORDER_PAYMENT_STATE_LABELS[orderPaymentState(this.order)];
  readonly loadingVoucher = signal(false);

  statusLabel(status: OrderRequestStatus): string {
    return ORDER_REQUEST_STATUS_LABELS[status];
  }

  typeLabel(type: OrderRequestType): string {
    return ORDER_REQUEST_TYPE_LABELS[type];
  }

  paymentMethodLabel(method: PaymentMethod): string {
    return PAYMENT_METHOD_LABELS[method];
  }

  deliveryMethodLabel(method: DeliveryMethod): string {
    return DELIVERY_METHOD_LABELS[method];
  }

  get whatsAppUrl(): string {
    const lines = this.order.items.map((it) => `• ${it.quantity} x ${it.productName} — S/ ${it.subtotal.toFixed(2)}`);
    const message =
      `Hola ${this.order.guestName}, te escribimos de RamichanStore por tu pedido web #${this.order.id}:\n\n` +
      `${lines.join('\n')}\n\n` +
      `Total: S/ ${this.order.total.toFixed(2)}`;
    return whatsAppLink(this.order.guestWhatsapp || this.order.guestPhone, message);
  }

  /** El comprobante exige permiso, así que se trae como blob autenticado (ver OrderRequestService). */
  openVoucher(): void {
    this.loadingVoucher.set(true);
    this.orderRequestService.getVoucherBlob(this.order.id).subscribe({
      next: (blob) => {
        this.loadingVoucher.set(false);
        const url = URL.createObjectURL(blob);
        this.dialog
          .open(ImagePreviewDialogComponent, {
            data: { imageUrl: url, title: `Comprobante del pedido #${this.order.id}` },
            maxWidth: '96vw',
          })
          .afterClosed()
          .subscribe(() => URL.revokeObjectURL(url));
      },
      error: () => this.loadingVoucher.set(false),
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
