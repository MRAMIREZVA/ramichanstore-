import { KeyValuePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
import { Brand, Category, ProductLine } from '../../../core/models/catalog.model';
import { PRODUCT_STATUS_LABELS, Product, ProductStatus } from '../../../core/models/product.model';
import { resolveImageUrl } from '../../../core/utils/image-url';
import { CatalogService } from '../../../core/services/catalog.service';
import { ProductFilters, ProductService } from '../../../core/services/product.service';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { BarcodeScannerDialogComponent } from '../../../shared/components/barcode-scanner-dialog/barcode-scanner-dialog';
import { PrintLabelDialogComponent } from '../../../shared/components/print-label-dialog/print-label-dialog';
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
    MatCheckboxModule,
  ],
  templateUrl: './products-list.html',
  styleUrl: './products-list.scss',
})
export class ProductsList implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly catalogService = inject(CatalogService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);

  readonly statusLabels = PRODUCT_STATUS_LABELS;
  readonly resolveImageUrl = resolveImageUrl;
  readonly displayedColumns = ['select', 'image', 'product', 'category', 'price', 'stock', 'status', 'actions'];

  /**
   * Map (no Set de ids) para conservar los datos completos del producto aunque el usuario
   * cambie de página — `products()` se reemplaza en cada `load()`, así que un Set de ids
   * perdería el nombre/precio/sku de lo seleccionado en una página anterior.
   */
  readonly selectedProducts = signal<Map<number, Product>>(new Map());
  readonly selectedCount = computed(() => this.selectedProducts().size);

  readonly loading = signal(true);
  readonly products = signal<Product[]>([]);
  readonly totalElements = signal(0);
  readonly categories = signal<Category[]>([]);
  readonly brands = signal<Brand[]>([]);
  readonly lines = signal<ProductLine[]>([]);
  readonly franchises = signal<string[]>([]);

  readonly searchControl = new FormControl('');
  readonly categoryControl = new FormControl<number | null>(null);
  readonly brandControl = new FormControl<number | null>(null);
  readonly lineControl = new FormControl<number | null>(null);
  readonly franchiseControl = new FormControl<string | null>(null);
  readonly statusControl = new FormControl<ProductStatus | null>(null);
  /** Deep-link desde Reportes → Inventario ("N productos sin costo registrado"). */
  readonly withoutCostControl = new FormControl<boolean>(false, { nonNullable: true });

  page = 0;
  pageSize = 20;

  ngOnInit(): void {
    this.catalogService.getCategories().subscribe((res) => this.categories.set(res.data));
    this.catalogService.getBrands().subscribe((res) => this.brands.set(res.data));
    this.catalogService.getProductLines().subscribe((res) => this.lines.set(res.data));
    this.productService.findFranchises().subscribe((res) => this.franchises.set(res.data));

    if (this.route.snapshot.queryParamMap.get('withoutCost') === 'true') {
      this.withoutCostControl.setValue(true, { emitEvent: false });
    }

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
    this.lineControl.valueChanges.subscribe(() => {
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
    this.withoutCostControl.valueChanges.subscribe(() => {
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
      lineId: this.lineControl.value,
      franchise: this.franchiseControl.value,
      status: this.statusControl.value,
      withoutCost: this.withoutCostControl.value || undefined,
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

  /** Nudge visual (Fase 44): ¿tiene algún dato de la ficha técnica de Fase 41 cargado? */
  hasSpecSheet(p: Product): boolean {
    return !!(
      p.material ||
      p.hasArticulations !== null ||
      p.includedAccessories ||
      p.packagingMaterial ||
      p.originCountry ||
      p.releaseDate ||
      p.packagedWeightGrams != null
    );
  }

  /** Sin esto, "margen" es Precio de venta − S/0 = 100% ficticio (ver Reportes → Inventario). */
  hasCost(p: Product): boolean {
    return p.totalCost > 0;
  }

  /** Punto de color por categoría, para escanear la columna de un vistazo — hash determinista, no depende del orden en que llegue la lista. */
  private readonly categoryPalette = ['#6D4AFF', '#2CA9C9', '#D64BA0', '#4C6EF5', '#A67C52', '#5B6472'];

  categoryColor(categoryName: string): string {
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      hash = (hash * 31 + categoryName.charCodeAt(i)) >>> 0;
    }
    return this.categoryPalette[hash % this.categoryPalette.length];
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchControl.value ||
      this.categoryControl.value ||
      this.brandControl.value ||
      this.lineControl.value ||
      this.franchiseControl.value ||
      this.statusControl.value ||
      this.withoutCostControl.value
    );
  }

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.categoryControl.setValue(null, { emitEvent: false });
    this.brandControl.setValue(null, { emitEvent: false });
    this.lineControl.setValue(null, { emitEvent: false });
    this.franchiseControl.setValue(null, { emitEvent: false });
    this.statusControl.setValue(null, { emitEvent: false });
    this.withoutCostControl.setValue(false, { emitEvent: false });
    this.page = 0;
    this.load();
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  isSelected(id: number): boolean {
    return this.selectedProducts().has(id);
  }

  toggleSelect(product: Product): void {
    this.selectedProducts.update((map) => {
      const next = new Map(map);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.set(product.id, product);
      }
      return next;
    });
  }

  clearSelection(): void {
    this.selectedProducts.set(new Map());
  }

  /** Imprime en una sola hoja las etiquetas de todos los productos marcados (no solo copias de uno). */
  printSelected(): void {
    const items = [...this.selectedProducts().values()].map((p) => ({ sku: p.sku, name: p.name, salePrice: p.salePrice }));
    if (items.length === 0) return;
    this.dialog.open(PrintLabelDialogComponent, {
      data: { items },
      width: '640px',
      maxWidth: '95vw',
    });
  }

  openCreate(): void {
    this.openForm(null);
  }

  /** Escanea un código (de fábrica o SKU propio) y abre directo la ficha del producto encontrado. */
  scanToFind(): void {
    const ref = this.dialog.open<BarcodeScannerDialogComponent, void, string | null>(BarcodeScannerDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((code) => {
      if (!code) return;
      this.productService.findByCode(code).subscribe({
        next: (res) => this.openForm(res.data),
        error: () => this.snackBar.open(`No se encontró ningún producto con el código "${code}"`, 'Cerrar', { duration: 4000 }),
      });
    });
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
      width: '960px',
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
