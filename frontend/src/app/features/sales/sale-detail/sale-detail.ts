import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  Sale,
} from '../../../core/models/sale.model';
import { BuyerCardComponent } from '../../../shared/components/buyer-card/buyer-card';

export interface SaleDetailData {
  sale: Sale;
}

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatTableModule, BuyerCardComponent],
  templateUrl: './sale-detail.html',
  styleUrl: './sale-detail.scss',
})
export class SaleDetailComponent {
  private readonly dialogRef = inject(MatDialogRef<SaleDetailComponent>);
  readonly data = inject<SaleDetailData>(MAT_DIALOG_DATA);

  readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;
  readonly paymentStatusLabels = PAYMENT_STATUS_LABELS;
  readonly deliveryMethodLabels = DELIVERY_METHOD_LABELS;
  readonly displayedColumns = ['product', 'quantity', 'unitPrice', 'discount', 'subtotal'];

  close(): void {
    this.dialogRef.close();
  }
}
