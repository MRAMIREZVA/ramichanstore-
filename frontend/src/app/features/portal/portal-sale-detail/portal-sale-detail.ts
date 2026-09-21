import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { DeliveryStatus } from '../../../core/models/delivery.model';
import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  Sale,
} from '../../../core/models/sale.model';

export interface PortalSaleDetailData {
  sale: Sale;
  /** Ya resueltas en portal-home (cruza la venta con /portal/deliveries) para no duplicar esa lógica acá. */
  deliveryLabel: string;
  deliveryStatusAttr: DeliveryStatus | 'NONE';
}

@Component({
  selector: 'app-portal-sale-detail',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatTableModule],
  templateUrl: './portal-sale-detail.html',
  styleUrl: './portal-sale-detail.scss',
})
export class PortalSaleDetailComponent {
  private readonly dialogRef = inject(MatDialogRef<PortalSaleDetailComponent>);
  readonly data = inject<PortalSaleDetailData>(MAT_DIALOG_DATA);

  readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;
  readonly paymentStatusLabels = PAYMENT_STATUS_LABELS;
  readonly deliveryMethodLabels = DELIVERY_METHOD_LABELS;
  readonly displayedColumns = ['product', 'quantity', 'unitPrice', 'subtotal'];

  close(): void {
    this.dialogRef.close();
  }
}
