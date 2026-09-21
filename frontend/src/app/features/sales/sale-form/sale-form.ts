import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Customer } from '../../../core/models/customer.model';
import { Product } from '../../../core/models/product.model';
import {
  DELIVERY_METHOD_LABELS,
  DeliveryMethod,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PaymentMethod,
  PaymentStatus,
  SaleRequest,
} from '../../../core/models/sale.model';
import { CustomerService } from '../../../core/services/customer.service';
import { ProductService } from '../../../core/services/product.service';
import { SaleService } from '../../../core/services/sale.service';

interface SaleLineDraft {
  product: Product | null;
  productSearchTerm: string;
  productOptions: Product[];
  searching: boolean;
  quantity: number;
  unitPrice: number;
  discount: number;
}

function emptyLine(): SaleLineDraft {
  return { product: null, productSearchTerm: '', productOptions: [], searching: false, quantity: 1, unitPrice: 0, discount: 0 };
}

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './sale-form.html',
  styleUrl: './sale-form.scss',
})
export class SaleFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly customerService = inject(CustomerService);
  private readonly saleService = inject(SaleService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<SaleFormComponent>);

  readonly paymentMethodOptions = Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][];
  readonly paymentStatusOptions = Object.entries(PAYMENT_STATUS_LABELS) as [PaymentStatus, string][];
  readonly deliveryMethodOptions = Object.entries(DELIVERY_METHOD_LABELS) as [DeliveryMethod, string][];

  readonly saving = signal(false);
  readonly searchingCustomer = signal(false);
  readonly customerOptions = signal<Customer[]>([]);
  readonly selectedCustomer = signal<Customer | null>(null);
  readonly lines = signal<SaleLineDraft[]>([emptyLine()]);

  readonly header = this.fb.group({
    customerSearch: [''],
    saleDate: [new Date(), Validators.required],
    paymentMethod: ['EFECTIVO' as PaymentMethod, Validators.required],
    paymentStatus: ['PAID' as PaymentStatus, Validators.required],
    deliveryMethod: ['PICKUP' as DeliveryMethod, Validators.required],
    notes: [''],
  });

  readonly subtotal = computed(() =>
    this.lines().reduce((sum, l) => sum + (l.product ? l.quantity * l.unitPrice : 0), 0),
  );
  readonly total = computed(() =>
    this.lines().reduce((sum, l) => sum + (l.product ? Math.max(0, l.quantity * l.unitPrice - l.discount) : 0), 0),
  );

  constructor() {
    this.header.controls.customerSearch.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term || (this.selectedCustomer() && term === this.customerLabel(this.selectedCustomer()!))) {
            return [];
          }
          this.searchingCustomer.set(true);
          return this.customerService.search({ search: term, page: 0, size: 10 });
        }),
      )
      .subscribe({
        next: (res) => {
          this.customerOptions.set(res.data.content);
          this.searchingCustomer.set(false);
        },
        error: () => this.searchingCustomer.set(false),
      });
  }

  customerLabel(customer: Customer | string | null): string {
    return customer && typeof customer === 'object' ? `${customer.fullName} — ${customer.phone}` : (customer ?? '');
  }

  onCustomerSelected(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.header.controls.customerSearch.setValue(this.customerLabel(customer), { emitEvent: false });
    this.customerOptions.set([]);
  }

  productLabel(product: Product | null): string {
    return product ? `${product.sku} — ${product.name}` : '';
  }

  onProductSearchChange(index: number, term: string): void {
    this.updateLine(index, { productSearchTerm: term });
    const line = this.lines()[index];
    if (!term || (line.product && term === this.productLabel(line.product))) {
      this.updateLine(index, { productOptions: [] });
      return;
    }
    this.updateLine(index, { searching: true });
    this.productService.search({ search: term, page: 0, size: 10 }).subscribe({
      next: (res) => this.updateLine(index, { productOptions: res.data.content, searching: false }),
      error: () => this.updateLine(index, { searching: false }),
    });
  }

  onProductSelected(index: number, product: Product): void {
    this.updateLine(index, {
      product,
      productSearchTerm: this.productLabel(product),
      productOptions: [],
      unitPrice: product.salePrice,
    });
  }

  updateLine(index: number, patch: Partial<SaleLineDraft>): void {
    this.lines.update((lines) => lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  addLine(): void {
    this.lines.update((lines) => [...lines, emptyLine()]);
  }

  removeLine(index: number): void {
    this.lines.update((lines) => lines.filter((_, i) => i !== index));
  }

  lineSubtotal(line: SaleLineDraft): number {
    return line.product ? Math.max(0, line.quantity * line.unitPrice - line.discount) : 0;
  }

  save(): void {
    const validLines = this.lines().filter((l) => l.product && l.quantity > 0);
    if (this.header.invalid || validLines.length === 0) {
      this.header.markAllAsTouched();
      this.snackBar.open('Agrega al menos un producto válido a la venta', 'Cerrar', { duration: 3000 });
      return;
    }

    const v = this.header.getRawValue();
    const request: SaleRequest = {
      customerId: this.selectedCustomer()?.id ?? null,
      saleDate: this.toIsoDate(v.saleDate as Date),
      paymentMethod: v.paymentMethod as PaymentMethod,
      paymentStatus: v.paymentStatus as PaymentStatus,
      deliveryMethod: v.deliveryMethod as DeliveryMethod,
      notes: v.notes || null,
      items: validLines.map((l) => ({
        productId: l.product!.id,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        discount: Number(l.discount),
      })),
    };

    this.saving.set(true);
    this.saleService.create(request).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.snackBar.open(response.message, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => this.saving.set(false),
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
