import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Product } from '../../../core/models/product.model';
import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PaymentStatus,
  Sale,
} from '../../../core/models/sale.model';
import { ProductService } from '../../../core/services/product.service';
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
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    BuyerCardComponent,
  ],
  templateUrl: './sale-detail.html',
  styleUrl: './sale-detail.scss',
})
export class SaleDetailComponent {
  private readonly dialogRef = inject(MatDialogRef<SaleDetailComponent, boolean>);
  private readonly saleService = inject(SaleService);
  private readonly productService = inject(ProductService);
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
          this.data.sale.items = res.data.items;
          this.data.sale.subtotal = res.data.subtotal;
          this.data.sale.total = res.data.total;
          this.data.sale.totalCost = res.data.totalCost;
          this.data.sale.profit = res.data.profit;
          this.data.sale.pointsGenerated = res.data.pointsGenerated;
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
}
