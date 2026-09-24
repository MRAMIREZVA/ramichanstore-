import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
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

interface ItemDraft {
  detailId: number;
  unitPrice: number;
  discount: number;
}

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
    MatInputModule,
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

  /** Permite corregir precio/descuento de una línea (ej. error de tipeo) — producto y cantidad quedan fijos. */
  readonly itemDrafts = signal<ItemDraft[]>(this.buildDrafts());
  readonly savingItems = signal(false);

  private buildDrafts(): ItemDraft[] {
    return this.data.sale.items.map((it) => ({ detailId: it.id, unitPrice: it.unitPrice, discount: it.discount }));
  }

  draftFor(detailId: number): ItemDraft {
    return this.itemDrafts().find((d) => d.detailId === detailId)!;
  }

  updateDraft(detailId: number, field: 'unitPrice' | 'discount', rawValue: string): void {
    const value = Number(rawValue);
    if (Number.isNaN(value)) return;
    this.itemDrafts.update((drafts) => drafts.map((d) => (d.detailId === detailId ? { ...d, [field]: value } : d)));
  }

  private changedDrafts(): ItemDraft[] {
    return this.itemDrafts().filter((d) => {
      const original = this.data.sale.items.find((it) => it.id === d.detailId);
      return original && (d.unitPrice !== original.unitPrice || d.discount !== original.discount);
    });
  }

  itemsDirty(): boolean {
    return this.changedDrafts().length > 0;
  }

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

  saveItems(): void {
    const items = this.changedDrafts().map((d) => ({ detailId: d.detailId, unitPrice: d.unitPrice, discount: d.discount }));
    if (items.length === 0) return;
    this.savingItems.set(true);
    this.saleService.updateItems(this.data.sale.id, { items }).subscribe({
      next: (res) => {
        this.data.sale.items = res.data.items;
        this.data.sale.subtotal = res.data.subtotal;
        this.data.sale.total = res.data.total;
        this.data.sale.totalCost = res.data.totalCost;
        this.data.sale.profit = res.data.profit;
        this.data.sale.pointsGenerated = res.data.pointsGenerated;
        this.itemDrafts.set(this.buildDrafts());
        this.changed = true;
        this.savingItems.set(false);
        this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
      },
      error: () => this.savingItems.set(false),
    });
  }

  close(): void {
    this.dialogRef.close(this.changed);
  }
}
