import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Brand, Category, ProductLine, Supplier } from '../../../core/models/catalog.model';
import { PRODUCT_STATUS_LABELS, Product, ProductRequest, ProductStatus } from '../../../core/models/product.model';
import { CatalogService } from '../../../core/services/catalog.service';
import { ProductService } from '../../../core/services/product.service';

export interface ProductFormData {
  product: Product | null;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly catalogService = inject(CatalogService);
  private readonly productService = inject(ProductService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<ProductFormComponent>);
  readonly data = inject<ProductFormData>(MAT_DIALOG_DATA);

  readonly isEdit = !!this.data.product;
  readonly saving = signal(false);
  readonly loadingCatalogs = signal(true);

  readonly categories = signal<Category[]>([]);
  readonly brands = signal<Brand[]>([]);
  readonly lines = signal<ProductLine[]>([]);
  readonly suppliers = signal<Supplier[]>([]);

  readonly statusOptions = Object.entries(PRODUCT_STATUS_LABELS) as [ProductStatus, string][];

  readonly form = this.fb.group({
    sku: [this.data.product?.sku ?? '', [Validators.required, Validators.maxLength(50)]],
    name: [this.data.product?.name ?? '', [Validators.required, Validators.maxLength(200)]],
    characterName: [this.data.product?.characterName ?? ''],
    franchise: [this.data.product?.franchise ?? ''],
    brandId: [this.data.product?.brandId ?? null, Validators.required],
    categoryId: [this.data.product?.categoryId ?? null, Validators.required],
    lineId: [this.data.product?.lineId ?? null],
    size: [this.data.product?.size ?? ''],
    mainImageUrl: [this.data.product?.mainImageUrl ?? ''],
    description: [this.data.product?.description ?? ''],
    purchasePrice: [this.data.product?.purchasePrice ?? 0, [Validators.required, Validators.min(0)]],
    additionalCosts: [this.data.product?.additionalCosts ?? 0, [Validators.required, Validators.min(0)]],
    salePrice: [this.data.product?.salePrice ?? 0, [Validators.required, Validators.min(0.01)]],
    currentStock: [this.data.product?.currentStock ?? 0, [Validators.required, Validators.min(0)]],
    minStock: [this.data.product?.minStock ?? 1, [Validators.required, Validators.min(0)]],
    status: [this.data.product?.status ?? 'AVAILABLE', Validators.required],
    location: [this.data.product?.location ?? ''],
    entryDate: [this.data.product?.entryDate ? new Date(this.data.product.entryDate) : null],
    supplierId: [this.data.product?.supplierId ?? null],
    notes: [this.data.product?.notes ?? ''],
  });

  constructor() {
    forkJoin({
      categories: this.catalogService.getCategories(),
      brands: this.catalogService.getBrands(),
      lines: this.catalogService.getProductLines(),
      suppliers: this.catalogService.getSuppliers(),
    }).subscribe({
      next: ({ categories, brands, lines, suppliers }) => {
        this.categories.set(categories.data);
        this.brands.set(brands.data);
        this.lines.set(lines.data);
        this.suppliers.set(suppliers.data);
        this.loadingCatalogs.set(false);
      },
      error: () => this.loadingCatalogs.set(false),
    });
  }

  get previewTotalCost(): number {
    const v = this.form.getRawValue();
    return (Number(v.purchasePrice) || 0) + (Number(v.additionalCosts) || 0);
  }

  get previewProfit(): number {
    const v = this.form.getRawValue();
    return (Number(v.salePrice) || 0) - this.previewTotalCost;
  }

  get previewMargin(): number {
    const v = this.form.getRawValue();
    const salePrice = Number(v.salePrice) || 0;
    if (salePrice <= 0) return 0;
    return (this.previewProfit / salePrice) * 100;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const request: ProductRequest = {
      sku: v.sku!,
      name: v.name!,
      characterName: v.characterName || null,
      franchise: v.franchise || null,
      brandId: v.brandId!,
      categoryId: v.categoryId!,
      lineId: v.lineId || null,
      description: v.description || null,
      mainImageUrl: v.mainImageUrl || null,
      additionalImageUrls: this.data.product?.additionalImageUrls ?? [],
      size: v.size || null,
      purchasePrice: Number(v.purchasePrice),
      additionalCosts: Number(v.additionalCosts),
      salePrice: Number(v.salePrice),
      currentStock: Number(v.currentStock),
      minStock: Number(v.minStock),
      status: v.status as ProductStatus,
      location: v.location || null,
      entryDate: v.entryDate ? this.toIsoDate(v.entryDate as unknown as Date) : null,
      supplierId: v.supplierId || null,
      notes: v.notes || null,
    };

    this.saving.set(true);
    const request$ = this.isEdit
      ? this.productService.update(this.data.product!.id, request)
      : this.productService.create(request);

    request$.subscribe({
      next: (response) => {
        this.snackBar.open(response.message, 'Cerrar', { duration: 3000 });
        this.dialogRef.close(response.data);
      },
      error: () => this.saving.set(false),
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
