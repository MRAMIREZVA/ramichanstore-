import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { PRODUCT_STATUS_LABELS, ProductStatus } from '../../../core/models/product.model';
import { CatalogFilterOption, PublicProduct, StoreInfo } from '../../../core/models/public-catalog.model';
import { CartService } from '../../../core/services/cart.service';
import { CatalogTrackingService } from '../../../core/services/catalog-tracking.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { PublicCatalogService } from '../../../core/services/public-catalog.service';
import { resolveImageUrl } from '../../../core/utils/image-url';

export interface FranchiseGroup {
  franchise: string;
  products: PublicProduct[];
}

/**
 * Vista agrupada por franquicia (Fase 77, bug reportado por el dueño): antes, cada
 * sección mostraba "lo que de esa franquicia haya caído en la página actual de 24"
 * — un accidente de la paginación alfabética por nombre de producto, no un reflejo real
 * del catálogo (una franquicia con 12 productos podía aparecer con 2 en una página y 6
 * en otra, según dónde cayeran sus nombres alfabéticamente). Ahora, sin ningún filtro
 * activo, se trae TODO el catálogo de una sola vez (tope generoso, bien por encima del
 * ~560 actual) y cada sección se recorta a un preview fijo — la cuenta que se ve ya
 * refleja el total real de esa franquicia (hasta el tope), no un resto de paginación.
 */
const GROUPED_VIEW_SIZE = 1000;
const FRANCHISE_PREVIEW_COUNT = 4;

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
    MatSidenavModule,
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
  private readonly wishlistService = inject(WishlistService);
  private readonly trackingService = inject(CatalogTrackingService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly breakpointObserver = inject(BreakpointObserver);

  /**
   * Debajo de este ancho, el panel de "Filtros" (Fase 44: pedido explícito de moverlo
   * a la izquierda) no cabe como columna fija — pasa a un drawer deslizable
   * (`mat-sidenav mode="over"`, mismo componente ya usado en el sidebar del admin)
   * que el visitante abre con un botón. 900px deja espacio de sobra para la grilla
   * de productos junto al panel de 264px en tablets/desktop chicos.
   */
  readonly isMobileFilters = toSignal(
    this.breakpointObserver.observe('(max-width: 900px)').pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  /**
   * En mobile, el drawer (`mode="over"`) se abre exactamente donde vive el botón "Filtros"
   * que lo dispara (el contenedor del sidenav empieza recién debajo del banner, no a
   * pantalla completa) — sin esto, el botón queda visible detrás del panel y su propio
   * encabezado "Filtros" se superpone con el del drawer. Se oculta el botón mientras el
   * drawer está abierto.
   */
  readonly filtersDrawerOpen = signal(false);

  readonly resolveImageUrl = resolveImageUrl;
  readonly statusLabels = PRODUCT_STATUS_LABELS;

  readonly searchControl = new FormControl('');
  readonly categoryControl = new FormControl<number | null>(null);
  readonly brandControl = new FormControl<number | null>(null);
  readonly lineControl = new FormControl<number | null>(null);
  readonly franchiseControl = new FormControl<string | null>(null);
  readonly onlyPreorderControl = new FormControl(false);
  /** Pedido explícito del dueño: poder ordenar el listado por anime. `null` = orden por defecto (nombre A-Z). */
  readonly sortControl = new FormControl<string | null>(null);

  readonly categories = signal<CatalogFilterOption[]>([]);
  readonly brands = signal<CatalogFilterOption[]>([]);
  readonly lines = signal<CatalogFilterOption[]>([]);
  readonly franchises = signal<string[]>([]);
  readonly storeInfo = signal<StoreInfo | null>(null);

  readonly loading = signal(true);
  readonly products = signal<PublicProduct[]>([]);
  readonly totalElements = signal(0);
  page = 0;
  pageSize = 24;

  /**
   * Sin ningún filtro activo, la vitrina se agrupa por franquicia/anime en vez de mostrar una grilla plana.
   * Método plano, no `computed()` — un `computed()` solo se recalcula cuando una SIGNAL que lee cambia, y
   * `FormControl.value` es una property normal, no una signal: envuelto en `computed()` quedaba congelado
   * en su primer valor (siempre `false`) para siempre, sin importar cuántas veces cambiaran los controles.
   * Mismo patrón ya usado y probado en `ProductsList.hasActiveFilters()` (admin).
   */
  hasActiveFilter(): boolean {
    return !!(
      this.searchControl.value ||
      this.categoryControl.value ||
      this.brandControl.value ||
      this.lineControl.value ||
      this.franchiseControl.value ||
      this.onlyPreorderControl.value ||
      this.sortControl.value
    );
  }

  readonly groupedByFranchise = computed<FranchiseGroup[]>(() => {
    const groups = new Map<string, PublicProduct[]>();
    for (const p of this.products()) {
      const key = p.franchise || 'Otros';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    // Pedido explícito del dueño: las secciones (antes en el orden en que aparecía cada
    // franquicia por primera vez en la página, siguiendo el orden por nombre de producto
    // de la lista sin agrupar) pasan a ordenarse alfabéticamente — "Otros" (productos sin
    // franquicia asignada) siempre al final, nunca intercalado alfabéticamente.
    return Array.from(groups.entries())
      .sort(([a], [b]) => {
        if (a === 'Otros') return 1;
        if (b === 'Otros') return -1;
        return a.localeCompare(b, 'es');
      })
      .map(([franchise, products]) => ({ franchise, products: products.slice(0, FRANCHISE_PREVIEW_COUNT) }));
  });

  ngOnInit(): void {
    this.trackingService.trackCatalogHome();
    this.catalogService.getCategories().subscribe((res) => this.categories.set(res.data));
    this.catalogService.getBrands().subscribe((res) => this.brands.set(res.data));
    this.catalogService.getLines().subscribe((res) => this.lines.set(res.data));
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
    this.lineControl.valueChanges.subscribe(() => {
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
    this.sortControl.valueChanges.subscribe(() => {
      this.page = 0;
      this.load();
    });

    this.load();
  }

  load(): void {
    this.loading.set(true);
    // Sin filtro: vista agrupada por franquicia, trae el catálogo completo de una sola vez
    // (ver GROUPED_VIEW_SIZE) para que cada sección refleje el total real — no "lo que
    // cayó" en una página de 24. Con cualquier filtro activo, sigue paginando normal.
    const grouped = !this.hasActiveFilter();
    this.catalogService
      .searchProducts({
        search: this.searchControl.value || undefined,
        categoryId: this.categoryControl.value,
        brandId: this.brandControl.value,
        lineId: this.lineControl.value,
        franchise: this.franchiseControl.value,
        onlyPreorder: !!this.onlyPreorderControl.value,
        sort: this.sortControl.value,
        page: grouped ? 0 : this.page,
        size: grouped ? GROUPED_VIEW_SIZE : this.pageSize,
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

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.categoryControl.setValue(null, { emitEvent: false });
    this.brandControl.setValue(null, { emitEvent: false });
    this.lineControl.setValue(null, { emitEvent: false });
    this.franchiseControl.setValue(null, { emitEvent: false });
    this.onlyPreorderControl.setValue(false, { emitEvent: false });
    this.sortControl.setValue(null, { emitEvent: false });
    this.page = 0;
    this.load();
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
    this.cartService.add(product, 1);
    this.snackBar.open(`${product.name} agregado al carrito`, 'Cerrar', { duration: 2500 });
  }

  isWishlisted(productId: number): boolean {
    return this.wishlistService.isWishlisted(productId);
  }

  toggleWishlist(product: PublicProduct, event: Event): void {
    event.stopPropagation();
    this.wishlistService.toggle(product);
  }

  filterByFranchise(franchise: string): void {
    this.franchiseControl.setValue(franchise);
  }

  statusLabel(status: ProductStatus): string {
    return this.statusLabels[status];
  }
}
