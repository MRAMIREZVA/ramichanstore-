import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { mixedCartMessage } from '../../../core/models/cart.model';
import { PRODUCT_STATUS_LABELS, ProductStatus } from '../../../core/models/product.model';
import { CatalogFilterOption, PublicProduct, StoreInfo } from '../../../core/models/public-catalog.model';
import { CartService } from '../../../core/services/cart.service';
import { PublicCatalogService } from '../../../core/services/public-catalog.service';
import { resolveImageUrl } from '../../../core/utils/image-url';

export interface FranchiseGroup {
  franchise: string;
  products: PublicProduct[];
}

@Component({
  selector: 'app-catalog-home',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './catalog-home.html',
  styleUrl: './catalog-home.scss',
})
export class CatalogHome implements OnInit {
  private readonly catalogService = inject(PublicCatalogService);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly snackBar = inject(MatSnackBar);

  readonly resolveImageUrl = resolveImageUrl;
  readonly statusLabels = PRODUCT_STATUS_LABELS;

  readonly searchControl = new FormControl('');
  readonly categoryControl = new FormControl<number | null>(null);
  readonly brandControl = new FormControl<number | null>(null);
  readonly franchiseControl = new FormControl<string | null>(null);
  readonly onlyPreorderControl = new FormControl(false);

  readonly categories = signal<CatalogFilterOption[]>([]);
  readonly brands = signal<CatalogFilterOption[]>([]);
  readonly franchises = signal<string[]>([]);
  readonly storeInfo = signal<StoreInfo | null>(null);

  readonly loading = signal(true);
  readonly products = signal<PublicProduct[]>([]);
  readonly totalElements = signal(0);
  page = 0;
  pageSize = 24;

  /** Sin ningún filtro activo, la vitrina se agrupa por franquicia/anime en vez de mostrar una grilla plana. */
  readonly hasActiveFilter = computed(
    () =>
      !!(
        this.searchControl.value ||
        this.categoryControl.value ||
        this.brandControl.value ||
        this.franchiseControl.value ||
        this.onlyPreorderControl.value
      ),
  );

  readonly groupedByFranchise = computed<FranchiseGroup[]>(() => {
    const groups = new Map<string, PublicProduct[]>();
    for (const p of this.products()) {
      const key = p.franchise || 'Otros';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    return Array.from(groups.entries()).map(([franchise, products]) => ({ franchise, products }));
  });

  ngOnInit(): void {
    this.catalogService.getCategories().subscribe((res) => this.categories.set(res.data));
    this.catalogService.getBrands().subscribe((res) => this.brands.set(res.data));
    this.catalogService.getFranchises().subscribe((res) => this.franchises.set(res.data));
    this.catalogService.getStoreInfo().subscribe((res) => this.storeInfo.set(res.data));

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
    this.onlyPreorderControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });

    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.catalogService
      .searchProducts({
        search: this.searchControl.value || undefined,
        categoryId: this.categoryControl.value,
        brandId: this.brandControl.value,
        franchise: this.franchiseControl.value,
        onlyPreorder: !!this.onlyPreorderControl.value,
        page: this.page,
        size: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          this.products.set(res.data.content);
          this.totalElements.set(res.data.totalElements);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  openProduct(product: PublicProduct): void {
    this.router.navigate(['/catalogo', product.id]);
  }

  addToCart(product: PublicProduct, event: Event): void {
    event.stopPropagation();
    if (!product.inStock) return;
    const result = this.cartService.add(product, 1);
    if (!result.ok) {
      this.snackBar.open(mixedCartMessage(result.cartHasPreorder), 'Cerrar', { duration: 4000 });
      return;
    }
    this.snackBar.open(`${product.name} agregado al carrito`, 'Cerrar', { duration: 2500 });
  }

  filterByFranchise(franchise: string): void {
    this.franchiseControl.setValue(franchise);
  }

  statusLabel(status: ProductStatus): string {
    return this.statusLabels[status];
  }
}
