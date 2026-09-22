import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { PREORDER_STATUS_LABELS, Preorder, PreorderRequest, PreorderStatus } from '../../../core/models/preorder.model';
import { Product } from '../../../core/models/product.model';
import { PreorderService } from '../../../core/services/preorder.service';
import { ProductService } from '../../../core/services/product.service';
import { parseIsoDate } from '../../../core/utils/date';

export interface PreorderFormData {
  preorder: Preorder | null;
}

@Component({
  selector: 'app-preorder-form',
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
  templateUrl: './preorder-form.html',
  styleUrl: './preorder-form.scss',
})
export class PreorderFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly preorderService = inject(PreorderService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<PreorderFormComponent>);
  readonly data = inject<PreorderFormData>(MAT_DIALOG_DATA);

  readonly statusOptions = Object.entries(PREORDER_STATUS_LABELS) as [PreorderStatus, string][];
  readonly saving = signal(false);
  readonly searching = signal(false);
  readonly productOptions = signal<Product[]>([]);
  readonly selectedProduct = signal<Product | null>(null);

  readonly form = this.fb.group({
    productSearch: [
      this.data.preorder ? `${this.data.preorder.productSku} — ${this.data.preorder.productName}` : '',
      Validators.required,
    ],
    minDepositAmount: [this.data.preorder?.minDepositAmount ?? 0, [Validators.required, Validators.min(0)]],
    startDate: [this.data.preorder ? parseIsoDate(this.data.preorder.startDate) : new Date(), Validators.required],
    limitDate: [this.data.preorder ? parseIsoDate(this.data.preorder.limitDate) : null, Validators.required],
    estimatedArrivalDate: [parseIsoDate(this.data.preorder?.estimatedArrivalDate)],
    availableQuantity: [this.data.preorder?.availableQuantity ?? 1, [Validators.required, Validators.min(1)]],
    status: [this.data.preorder?.status ?? 'COMING_SOON', Validators.required],
    notes: ['', Validators.maxLength(500)],
  });

  constructor() {
    if (this.data.preorder) {
      this.form.controls.productSearch.disable();
    }

    this.form.controls.productSearch.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term || (this.selectedProduct() && term === this.productLabel(this.selectedProduct()!))) {
            return [];
          }
          this.searching.set(true);
          return this.productService.search({ search: term, page: 0, size: 10 });
        }),
      )
      .subscribe({
        next: (res) => {
          this.productOptions.set(res.data.content);
          this.searching.set(false);
        },
        error: () => this.searching.set(false),
      });
  }

  productLabel(product: Product | string | null): string {
    return product && typeof product === 'object' ? `${product.sku} — ${product.name}` : (product ?? '');
  }

  onProductSelected(product: Product): void {
    this.selectedProduct.set(product);
    this.form.controls.productSearch.setValue(this.productLabel(product), { emitEvent: false });
    this.productOptions.set([]);
  }

  save(): void {
    const productId = this.data.preorder?.productId ?? this.selectedProduct()?.id;
    if (!productId || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const request: PreorderRequest = {
      productId,
      minDepositAmount: Number(v.minDepositAmount),
      startDate: this.toIsoDate(v.startDate as Date),
      limitDate: this.toIsoDate(v.limitDate as Date),
      estimatedArrivalDate: v.estimatedArrivalDate ? this.toIsoDate(v.estimatedArrivalDate as Date) : null,
      availableQuantity: Number(v.availableQuantity),
      status: v.status as PreorderStatus,
      notes: v.notes || null,
    };

    this.saving.set(true);
    const request$ = this.data.preorder
      ? this.preorderService.update(this.data.preorder.id, request)
      : this.preorderService.create(request);

    request$.subscribe({
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
