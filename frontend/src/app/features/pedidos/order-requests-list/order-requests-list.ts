import { KeyValuePipe, SlicePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DELIVERY_METHOD_LABELS, DeliveryMethod, PAYMENT_METHOD_LABELS, PaymentMethod } from '../../../core/models/sale.model';
import { ORDER_REQUEST_STATUS_LABELS, OrderRequest, OrderRequestStatus } from '../../../core/models/order-request.model';
import { OrderRequestFilters, OrderRequestService } from '../../../core/services/order-request.service';
import { whatsAppLink } from '../../../core/utils/whatsapp';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import {
  RejectOrderRequestDialogComponent,
  RejectOrderRequestDialogData,
} from '../reject-order-request-dialog/reject-order-request-dialog';

/**
 * Pedidos enviados desde el carrito del catálogo público (Fase 18) — NO son
 * ventas reales hasta que el admin los convierte (crea una Sale real vía
 * OrderRequestService.convert → SaleService.create) o los rechaza.
 */
@Component({
  selector: 'app-order-requests-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    KeyValuePipe,
    SlicePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './order-requests-list.html',
  styleUrl: './order-requests-list.scss',
})
export class OrderRequestsList implements OnInit {
  private readonly orderRequestService = inject(OrderRequestService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly statusLabels = ORDER_REQUEST_STATUS_LABELS;
  readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;
  readonly deliveryMethodLabels = DELIVERY_METHOD_LABELS;
  readonly displayedColumns = ['guest', 'items', 'payment', 'delivery', 'status', 'createdAt', 'actions'];

  readonly loading = signal(true);
  readonly orderRequests = signal<OrderRequest[]>([]);
  readonly totalElements = signal(0);

  readonly statusControl = new FormControl<OrderRequestStatus | null>(null);

  page = 0;
  pageSize = 20;

  ngOnInit(): void {
    this.statusControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const filters: OrderRequestFilters = { status: this.statusControl.value, page: this.page, size: this.pageSize };
    this.orderRequestService.search(filters).subscribe({
      next: (res) => {
        this.orderRequests.set(res.data.content);
        this.totalElements.set(res.data.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  itemsSummary(order: OrderRequest): string {
    return `${order.items.length} producto(s)`;
  }

  /**
   * Alerta "básica" pedida por el dueño: cuando llega un pedido web, el admin puede avisarle
   * al cliente por WhatsApp de una vez, con el detalle, para arrancar la venta/separación/
   * preventa — mismo patrón `whatsAppLink()` que ya usan Sales/Separations/Reservations
   * (Fase 15), aplicado acá donde todavía no existía ningún contacto directo con el cliente.
   */
  contactWhatsAppLink(order: OrderRequest): string {
    const lines = order.items.map((it) => `• ${it.quantity} x ${it.productName} — S/ ${it.subtotal.toFixed(2)}`);
    const message =
      `Hola ${order.guestName}, te escribimos de RamichanStore por tu pedido web #${order.id}:\n\n` +
      `${lines.join('\n')}\n\n` +
      `Total: S/ ${order.total.toFixed(2)}\n` +
      `Pago preferido: ${this.paymentMethodLabel(order.preferredPaymentMethod)}\n` +
      `Entrega: ${this.deliveryMethodLabel(order.deliveryMethod)}\n\n` +
      `Para arrancar tu compra/separación/preventa, cuéntanos cómo prefieres coordinar el pago.`;
    return whatsAppLink(order.guestWhatsapp || order.guestPhone, message);
  }

  statusLabel(status: OrderRequestStatus): string {
    return this.statusLabels[status];
  }

  paymentMethodLabel(method: PaymentMethod): string {
    return this.paymentMethodLabels[method];
  }

  deliveryMethodLabel(method: DeliveryMethod): string {
    return this.deliveryMethodLabels[method];
  }

  confirmConvert(order: OrderRequest): void {
    const data: ConfirmDialogData = {
      title: 'Convertir a venta',
      message: `Esto crea una venta real para "${order.guestName}" — descuenta stock y genera puntos como cualquier venta. ¿Confirmas?`,
      confirmLabel: 'Convertir',
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.orderRequestService.convert(order.id).subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.load();
        },
      });
    });
  }

  openReject(order: OrderRequest): void {
    const data: RejectOrderRequestDialogData = { orderRequest: order };
    const ref = this.dialog.open<RejectOrderRequestDialogComponent, RejectOrderRequestDialogData, string | null>(
      RejectOrderRequestDialogComponent,
      { data, width: '460px' },
    );
    ref.afterClosed().subscribe((reason) => {
      if (!reason) return;
      this.orderRequestService.reject(order.id, reason).subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.load();
        },
      });
    });
  }
}
