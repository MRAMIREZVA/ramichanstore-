import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { InventoryMovement, MOVEMENT_TYPE_LABELS, MovementType } from '../../../core/models/inventory.model';
import { Product } from '../../../core/models/product.model';
import { InventoryFilters, InventoryService } from '../../../core/services/inventory.service';
import { ProductService } from '../../../core/services/product.service';
import { LowStockDialogComponent, LowStockDialogData } from '../low-stock-dialog/low-stock-dialog';
import { MovementFormComponent, MovementFormData } from '../movement-form/movement-form';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './inventory-list.html',
  styleUrl: './inventory-list.scss',
})
export class InventoryList implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly productService = inject(ProductService);
  private readonly dialog = inject(MatDialog);

  readonly typeLabels = MOVEMENT_TYPE_LABELS;
  readonly typeOptions = Object.entries(MOVEMENT_TYPE_LABELS) as [MovementType, string][];
  readonly displayedColumns = ['date', 'product', 'type', 'quantity', 'stock', 'reason', 'user'];

  readonly loading = signal(true);
  readonly movements = signal<InventoryMovement[]>([]);
  readonly totalElements = signal(0);
  readonly lowStockProducts = signal<Product[]>([]);

  readonly typeControl = new FormControl<MovementType | null>(null);
  readonly fromControl = new FormControl<Date | null>(null);
  readonly toControl = new FormControl<Date | null>(null);
  readonly productFilterControl = new FormControl('');

  readonly productOptions = signal<Product[]>([]);
  readonly selectedProduct = signal<Product | null>(null);

  page = 0;
  pageSize = 20;

  ngOnInit(): void {
    this.loadLowStock();

    this.typeControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.fromControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });
    this.toControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });

    this.productFilterControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term || (this.selectedProduct() && term === this.productLabel(this.selectedProduct()!))) {
            return [];
          }
          return this.productService.search({ search: term, page: 0, size: 10 });
        }),
      )
      .subscribe((res) => this.productOptions.set(res.data.content));

    this.load();
  }

  productLabel(product: Product | string | null): string {
    return product && typeof product === 'object' ? `${product.sku} — ${product.name}` : (product ?? '');
  }

  onProductSelected(product: Product): void {
    this.selectedProduct.set(product);
    this.productFilterControl.setValue(this.productLabel(product), { emitEvent: false });
    this.productOptions.set([]);
    this.page = 0;
    this.load();
  }

  clearProductFilter(): void {
    this.selectedProduct.set(null);
    this.productFilterControl.setValue('', { emitEvent: false });
    this.productOptions.set([]);
    this.page = 0;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const filters: InventoryFilters = {
      productId: this.selectedProduct()?.id ?? null,
      type: this.typeControl.value,
      from: this.toIsoDate(this.fromControl.value),
      to: this.toIsoDate(this.toControl.value),
      page: this.page,
      size: this.pageSize,
    };
    this.inventoryService.search(filters).subscribe({
      next: (res) => {
        this.movements.set(res.data.content);
        this.totalElements.set(res.data.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  typeLabel(type: MovementType): string {
    return this.typeLabels[type];
  }

  loadLowStock(): void {
    this.inventoryService.lowStock().subscribe((res) => this.lowStockProducts.set(res.data));
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  openLowStockDialog(): void {
    const data: LowStockDialogData = { products: this.lowStockProducts() };
    const ref = this.dialog.open<LowStockDialogComponent, LowStockDialogData, Product | null>(LowStockDialogComponent, {
      data,
      width: '520px',
      maxWidth: '95vw',
      autoFocus: false,
    });
    ref.afterClosed().subscribe((product) => {
      if (product) {
        this.openMovementForm(product);
      }
    });
  }

  openMovementForm(product: Product | null = null): void {
    const ref = this.dialog.open<MovementFormComponent, MovementFormData, boolean>(MovementFormComponent, {
      data: { product },
      width: '600px',
      maxWidth: '95vw',
      autoFocus: false,
    });
    ref.afterClosed().subscribe((changed) => {
      if (changed) {
        this.load();
        this.loadLowStock();
      }
    });
  }

  private toIsoDate(date: Date | null): string | null {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
