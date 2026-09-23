import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PaymentStatus,
  Sale,
} from '../../../core/models/sale.model';
import { SaleService } from '../../../core/services/sale.service';
import { resolveImageUrl } from '../../../core/utils/image-url';
import { BuyerCardComponent } from '../../../shared/components/buyer-card/buyer-card';

export interface SaleDetailData {
  sale: Sale;
}

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    BuyerCardComponent,
  ],
  templateUrl: './sale-detail.html',
  styleUrl: './sale-detail.scss',
})
export class SaleDetailComponent {
  private readonly dialogRef = inject(MatDialogRef<SaleDetailComponent, boolean>);
  private readonly saleService = inject(SaleService);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<SaleDetailData>(MAT_DIALOG_DATA);

  readonly resolveImageUrl = resolveImageUrl;
  readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;
  readonly paymentStatusLabels = PAYMENT_STATUS_LABELS;
  readonly deliveryMethodLabels = DELIVERY_METHOD_LABELS;
  readonly displayedColumns = ['image', 'product', 'quantity', 'unitPrice', 'discount', 'subtotal'];

  /** CANCELLED queda fuera: esa transición solo pasa por "Cancelar venta" (revierte stock y puntos). */
  readonly statusOptions = (Object.entries(PAYMENT_STATUS_LABELS) as [PaymentStatus, string][]).filter(
    ([key]) => key !== 'CANCELLED',
  );
  readonly statusControl = new FormControl<PaymentStatus>(this.data.sale.paymentStatus, { nonNullable: true });
  readonly savingStatus = signal(false);
  private changed = false;

  saveStatus(): void {
    const newStatus = this.statusControl.value;
    if (newStatus === this.data.sale.paymentStatus) return;
    this.savingStatus.set(true);
    this.saleService.updatePaymentStatus(this.data.sale.id, newStatus).subscribe({
      next: (res) => {
        this.data.sale.paymentStatus = newStatus;
        this.changed = true;
        this.savingStatus.set(false);
        this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
      },
      error: () => this.savingStatus.set(false),
    });
  }

  close(): void {
    this.dialogRef.close(this.changed);
  }
}
