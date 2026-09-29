import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Product } from '../../../core/models/product.model';
import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PaymentMethod,
  PaymentStatus,
  Sale,
  SalePayment,
} from '../../../core/models/sale.model';
import { ProductService } from '../../../core/services/product.service';
import { SaleService } from '../../../core/services/sale.service';
import { parseIsoDate } from '../../../core/utils/date';
import { resolveImageUrl } from '../../../core/utils/image-url';
import { BuyerCardComponent } from '../../../shared/components/buyer-card/buyer-card';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { SaleReceiptDialogComponent } from '../sale-receipt-dialog/sale-receipt-dialog';

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
    MatAutocompleteModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    BuyerCardComponent,
  ],
  templateUrl: './sale-detail.html',
  styleUrl: './sale-detail.scss',
})
export class SaleDetailComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<SaleDetailComponent, boolean>);
  private readonly saleService = inject(SaleService);
  private readonly productService = inject(ProductService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
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
        Object.assign(this.data.sale, res.data);
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

  openReceipt(): void {
    this.dialog.open(SaleReceiptDialogComponent, {
      data: { sale: this.data.sale, payments: this.data.sale.type === 'SEPARACION' ? this.payments() : [] },
      width: '720px',
      maxWidth: '95vw',
    });
  }

  /**
   * Agrega un producto NUEVO a la venta (ej. el cliente decide llevar una figura más mientras
   * se revisa su pedido) — a diferencia de corregir precio/descuento arriba, esto SÍ valida y
   * descuenta stock (mismo endpoint que una venta nueva). Solo disponible si la venta no está
   * cancelada, igual que el resto de ediciones de este diálogo.
   */
  readonly productSearchControl = new FormControl('');
  readonly productOptions = signal<Product[]>([]);
  readonly selectedProduct = signal<Product | null>(null);
  readonly searchingProduct = signal(false);
  readonly newQuantity = signal(1);
  readonly newUnitPrice = signal(0);
  readonly newDiscount = signal(0);
  readonly addingItem = signal(false);

  // ---- Ledger de abonos (solo visible cuando data.sale.type === 'SEPARACION') ----
  readonly payments = signal<SalePayment[]>([]);
  readonly loadingPayments = signal(false);
  readonly savingPayment = signal(false);
  readonly editingPaymentId = signal<number | null>(null);
  readonly paymentMethodOptions = Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][];
  readonly paymentColumns = ['date', 'amount', 'method', 'user', 'actions'];

  readonly paymentForm = this.fb.group({
    amount: [0],
    paymentMethod: ['EFECTIVO' as PaymentMethod],
    paymentDate: [new Date()],
    notes: [''],
  });

  constructor() {
    this.productSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term || (this.selectedProduct() && term === this.productLabel(this.selectedProduct()))) {
            return [];
          }
          this.searchingProduct.set(true);
          return this.productService.search({ search: term, page: 0, size: 10 });
        }),
      )
      .subscribe({
        next: (res) => {
          this.productOptions.set(res.data.content);
          this.searchingProduct.set(false);
        },
        error: () => this.searchingProduct.set(false),
      });

    if (this.data.sale.type === 'SEPARACION') {
      this.loadPayments();
    }
  }

  paymentMethodLabel(method: PaymentMethod): string {
    return this.paymentMethodLabels[method];
  }

  productLabel(product: Product | string | null): string {
    return product && typeof product === 'object' ? `${product.sku} — ${product.name}` : (product ?? '');
  }

  onProductSelected(product: Product): void {
    this.selectedProduct.set(product);
    this.productSearchControl.setValue(this.productLabel(product), { emitEvent: false });
    this.productOptions.set([]);
    this.newUnitPrice.set(product.salePrice);
  }

  addNewItem(): void {
    const product = this.selectedProduct();
    if (!product || this.newQuantity() < 1 || this.addingItem()) return;

    this.addingItem.set(true);
    this.saleService
      .addItem(this.data.sale.id, {
        productId: product.id,
        quantity: this.newQuantity(),
        unitPrice: this.newUnitPrice(),
        discount: this.newDiscount(),
      })
      .subscribe({
        next: (res) => {
          Object.assign(this.data.sale, res.data);
          this.itemDrafts.set(this.buildDrafts());
          this.changed = true;
          this.addingItem.set(false);
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });

          this.selectedProduct.set(null);
          this.productSearchControl.setValue('', { emitEvent: false });
          this.newQuantity.set(1);
          this.newUnitPrice.set(0);
          this.newDiscount.set(0);
        },
        error: () => this.addingItem.set(false),
      });
  }

  loadPayments(): void {
    this.loadingPayments.set(true);
    this.saleService.listPayments(this.data.sale.id).subscribe({
      next: (res) => {
        this.payments.set(res.data);
        this.loadingPayments.set(false);
      },
      error: () => this.loadingPayments.set(false),
    });
  }

  private refreshSale(): void {
    this.saleService.findById(this.data.sale.id).subscribe((res) => {
      Object.assign(this.data.sale, res.data);
      this.statusControl.setValue(res.data.paymentStatus, { emitEvent: false });
    });
  }

  submitPayment(): void {
    const v = this.paymentForm.getRawValue();
    if (!v.amount || v.amount <= 0 || !v.paymentDate) {
      this.paymentForm.markAllAsTouched();
      return;
    }
    const date = v.paymentDate as Date;
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const request = {
      amount: Number(v.amount),
      paymentMethod: v.paymentMethod as PaymentMethod,
      paymentDate: iso,
      notes: v.notes || null,
    };

    const editingId = this.editingPaymentId();
    const obs = editingId
      ? this.saleService.updatePayment(this.data.sale.id, editingId, request)
      : this.saleService.registerPayment(this.data.sale.id, request);

    this.savingPayment.set(true);
    obs.subscribe({
      next: (res) => {
        this.savingPayment.set(false);
        this.changed = true;
        this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
        this.cancelEditPayment();
        this.loadPayments();
        this.refreshSale();
      },
      error: () => this.savingPayment.set(false),
    });
  }

  startEditPayment(payment: SalePayment): void {
    this.editingPaymentId.set(payment.id);
    this.paymentForm.setValue({
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: parseIsoDate(payment.paymentDate) ?? new Date(),
      notes: payment.notes ?? '',
    });
  }

  cancelEditPayment(): void {
    this.editingPaymentId.set(null);
    this.paymentForm.reset({ amount: 0, paymentMethod: 'EFECTIVO', paymentDate: new Date(), notes: '' });
  }

  deletePayment(payment: SalePayment): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar abono',
      message: `¿Eliminar el abono de S/ ${payment.amount.toFixed(2)} del ${payment.paymentDate}? El estado de la separación se recalculará.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.saleService.deletePayment(this.data.sale.id, payment.id).subscribe({
        next: (res) => {
          this.changed = true;
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          if (this.editingPaymentId() === payment.id) this.cancelEditPayment();
          this.loadPayments();
          this.refreshSale();
        },
      });
    });
  }
}
