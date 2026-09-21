import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Customer } from '../../../core/models/customer.model';
import { Product } from '../../../core/models/product.model';
import { SeparationRequest } from '../../../core/models/separation.model';
import { CustomerService } from '../../../core/services/customer.service';
import { ProductService } from '../../../core/services/product.service';
import { SeparationService } from '../../../core/services/separation.service';

@Component({
  selector: 'app-separation-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './separation-form.html',
  styleUrl: './separation-form.scss',
})
export class SeparationFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly productService = inject(ProductService);
  private readonly separationService = inject(SeparationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<SeparationFormComponent>);

  readonly saving = signal(false);
  readonly searchingCustomer = signal(false);
  readonly searchingProduct = signal(false);
  readonly customerOptions = signal<Customer[]>([]);
  readonly productOptions = signal<Product[]>([]);
  readonly selectedCustomer = signal<Customer | null>(null);
  readonly selectedProduct = signal<Product | null>(null);

  readonly form = this.fb.group({
    customerSearch: ['', Validators.required],
    productSearch: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    totalPrice: [0, [Validators.required, Validators.min(0.01)]],
    separationDate: [new Date(), Validators.required],
    limitDate: [null as Date | null, Validators.required],
    notes: ['', Validators.maxLength(500)],
  });

  constructor() {
    this.form.controls.customerSearch.valueChanges
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

    this.form.controls.productSearch.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term || (this.selectedProduct() && term === this.productLabel(this.selectedProduct()!))) {
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

  customerLabel(customer: Customer | string | null): string {
    return customer && typeof customer === 'object' ? `${customer.fullName} — ${customer.phone}` : (customer ?? '');
  }

  productLabel(product: Product | string | null): string {
    return product && typeof product === 'object' ? `${product.sku} — ${product.name}` : (product ?? '');
  }

  onCustomerSelected(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.form.controls.customerSearch.setValue(this.customerLabel(customer), { emitEvent: false });
    this.customerOptions.set([]);
  }

  onProductSelected(product: Product): void {
    this.selectedProduct.set(product);
    this.form.controls.productSearch.setValue(this.productLabel(product), { emitEvent: false });
    this.productOptions.set([]);
    if (!this.form.controls.totalPrice.dirty) {
      this.form.controls.totalPrice.setValue(product.salePrice * this.form.controls.quantity.value!);
    }
  }

  save(): void {
    const customer = this.selectedCustomer();
    const product = this.selectedProduct();
    if (!customer || !product || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const request: SeparationRequest = {
      customerId: customer.id,
      productId: product.id,
      quantity: Number(v.quantity),
      totalPrice: Number(v.totalPrice),
      separationDate: this.toIsoDate(v.separationDate as Date),
      limitDate: this.toIsoDate(v.limitDate as Date),
      notes: v.notes || null,
    };

    this.saving.set(true);
    this.separationService.create(request).subscribe({
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
