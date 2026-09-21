import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import {
  MOVEMENT_TYPES_THAT_INCREASE,
  MOVEMENT_TYPE_LABELS,
  MovementType,
} from '../../../core/models/inventory.model';
import { Product } from '../../../core/models/product.model';
import { InventoryService } from '../../../core/services/inventory.service';
import { ProductService } from '../../../core/services/product.service';

export interface MovementFormData {
  product: Product | null;
}

@Component({
  selector: 'app-movement-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './movement-form.html',
  styleUrl: './movement-form.scss',
})
export class MovementFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly inventoryService = inject(InventoryService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<MovementFormComponent>);
  readonly data = inject<MovementFormData>(MAT_DIALOG_DATA);

  readonly typeOptions = Object.entries(MOVEMENT_TYPE_LABELS) as [MovementType, string][];
  readonly saving = signal(false);
  readonly searching = signal(false);
  readonly productOptions = signal<Product[]>([]);
  readonly selectedProduct = signal<Product | null>(this.data.product);

  readonly form = this.fb.group({
    productSearch: [
      this.data.product ? `${this.data.product.sku} — ${this.data.product.name}` : '',
      Validators.required,
    ],
    movementType: ['INGRESO' as MovementType, Validators.required],
    quantity: [1, Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(255)]],
    observation: ['', Validators.maxLength(1000)],
  });

  readonly directionHint = computed(() => {
    const type = this.form.controls.movementType.value;
    if (!type) return '';
    if (type === 'AJUSTE') return 'Ingresa un valor positivo para sumar o negativo para restar del stock.';
    return MOVEMENT_TYPES_THAT_INCREASE.includes(type)
      ? 'Este tipo aumenta el stock. Ingresa una cantidad positiva.'
      : 'Este tipo disminuye el stock. Ingresa una cantidad positiva.';
  });

  constructor() {
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

  get previewNewStock(): number | null {
    const product = this.selectedProduct();
    const type = this.form.controls.movementType.value;
    const quantity = Number(this.form.controls.quantity.value) || 0;
    if (!product || !type) return null;
    const delta = type === 'AJUSTE' ? quantity : MOVEMENT_TYPES_THAT_INCREASE.includes(type) ? Math.abs(quantity) : -Math.abs(quantity);
    return product.currentStock + delta;
  }

  save(): void {
    const product = this.selectedProduct();
    if (!product || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const type = v.movementType as MovementType;
    const rawQuantity = Number(v.quantity);
    const quantity = type === 'AJUSTE' ? rawQuantity : Math.abs(rawQuantity);

    this.saving.set(true);
    this.inventoryService
      .registerMovement({
        productId: product.id,
        movementType: type,
        quantity,
        reason: v.reason!,
        observation: v.observation || null,
      })
      .subscribe({
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
}
