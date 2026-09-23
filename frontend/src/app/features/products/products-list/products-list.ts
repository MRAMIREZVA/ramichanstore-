import { KeyValuePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Brand, Category } from '../../../core/models/catalog.model';
import { PRODUCT_STATUS_LABELS, Product, ProductStatus } from '../../../core/models/product.model';
import { resolveImageUrl } from '../../../core/utils/image-url';
import { CatalogService } from '../../../core/services/catalog.service';
import { ProductFilters, ProductService } from '../../../core/services/product.service';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ProductFormComponent, ProductFormData } from '../product-form/product-form';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    KeyValuePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './products-list.html',
  styleUrl: './products-list.scss',
})
export class ProductsList implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly catalogService = inject(CatalogService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly statusLabels = PRODUCT_STATUS_LABELS;
  readonly resolveImageUrl = resolveImageUrl;
  readonly displayedColumns = ['image', 'sku', 'name', 'category', 'price', 'margin', 'stock', 'status', 'actions'];

  readonly loading = signal(true);
  readonly products = signal<Product[]>([]);
  readonly totalElements = signal(0);
  readonly categories = signal<Category[]>([]);
  readonly brands = signal<Brand[]>([]);
  readonly franchises = signal<string[]>([]);

  readonly searchControl = new FormControl('');
  readonly categoryControl = new FormControl<number | null>(null);
  readonly brandControl = new FormControl<number | null>(null);
  readonly franchiseControl = new FormControl<string | null>(null);
  readonly statusControl = new FormControl<ProductStatus | null>(null);

  page = 0;
  pageSize = 20;

  ngOnInit(): void {
    this.catalogService.getCategories().subscribe((res) => this.categories.set(res.data));
    this.catalogService.getBrands().subscribe((res) => this.brands.set(res.data));
    this.productService.findFranchises().subscribe((res) => this.franchises.set(res.data));

    this.searchControl.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.categoryControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.brandControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.franchiseControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.statusControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });

    this.load();
  }

  load(): void {
    this.loading.set(true);
    const filters: ProductFilters = {
      search: this.searchControl.value ?? undefined,
      categoryId: this.categoryControl.value,
      brandId: this.brandControl.value,
      franchise: this.franchiseControl.value,
      status: this.statusControl.value,
      page: this.page,
      size: this.pageSize,
    };
    this.productService.search(filters).subscribe({
      next: (res) => {
        this.products.set(res.data.content);
        this.totalElements.set(res.data.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(status: ProductStatus): string {
    return this.statusLabels[status];
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  openCreate(): void {
    this.openForm(null);
  }

  openEdit(product: Product): void {
    this.openForm(product);
  }

  duplicateProduct(product: Product): void {
    this.openForm(null, product);
  }

  private openForm(product: Product | null, duplicateFrom: Product | null = null): void {
    const ref = this.dialog.open<ProductFormComponent, ProductFormData, Product | null>(ProductFormComponent, {
      data: { product, duplicateFrom },
      width: '760px',
      maxWidth: '95vw',
      autoFocus: false,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.load();
      }
    });
  }

  confirmDelete(product: Product): void {
    const data: ConfirmDialogData = {
      title: 'Eliminar producto',
      message: `¿Seguro que deseas eliminar "${product.name}" (SKU ${product.sku})? Esta acción lo oculta del catálogo pero conserva su historial.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.productService.delete(product.id).subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.load();
        },
      });
    });
  }
}
