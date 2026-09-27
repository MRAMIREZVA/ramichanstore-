import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PRODUCT_STATUS_LABELS } from '../../../core/models/product.model';
import { PublicPreorderInfo, PublicProduct } from '../../../core/models/public-catalog.model';
import { StockAlertSubmission } from '../../../core/models/stock-alert.model';
import { CartService } from '../../../core/services/cart.service';
import { PublicCatalogService } from '../../../core/services/public-catalog.service';
import { StockAlertService } from '../../../core/services/stock-alert.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { resolveImageUrl } from '../../../core/utils/image-url';
import { whatsAppLink } from '../../../core/utils/whatsapp';

@Component({
  selector: 'app-catalog-product-detail',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './catalog-product-detail.html',
  styleUrl: './catalog-product-detail.scss',
})
export class CatalogProductDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly catalogService = inject(PublicCatalogService);
  private readonly cartService = inject(CartService);
  private readonly stockAlertService = inject(StockAlertService);
  private readonly wishlistService = inject(WishlistService);
  private readonly snackBar = inject(MatSnackBar);

  readonly resolveImageUrl = resolveImageUrl;
  readonly statusLabels = PRODUCT_STATUS_LABELS;

  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly product = signal<PublicProduct | null>(null);
  readonly activeImageUrl = signal<string | null>(null);
  readonly quantity = signal(1);
  readonly relatedProducts = signal<PublicProduct[]>([]);

  /** null si el admin no configuró STORE_WHATSAPP en Configuración (mismo patrón que catalog-layout/contactWhatsAppUrl). */
  readonly storeWhatsapp = signal<string | null>(null);

  readonly whatsappBuyUrl = computed(() => {
    const product = this.product();
    const phone = this.storeWhatsapp();
    if (!product || !phone || !product.inStock) return null;
    const message = `Hola! Quiero comprar: ${product.name} (S/ ${product.salePrice.toFixed(2)}) x${this.quantity()} — SKU ${product.sku}`;
    return whatsAppLink(phone, message);
  });

  readonly isWishlisted = computed(() => {
    const product = this.product();
    return product ? this.wishlistService.isWishlisted(product.id) : false;
  });

  readonly stockAlertSaving = signal(false);
  readonly stockAlertSubmitted = signal(false);
  readonly stockAlertForm = this.fb.group({
    customerName: ['', [Validators.required, Validators.maxLength(200)]],
    customerPhone: ['', [Validators.required, Validators.maxLength(30)]],
  });

  /**
   * `route.paramMap` (Observable), no `route.snapshot.paramMap` (valor único leído una
   * sola vez) — Angular REUTILIZA la misma instancia del componente al navegar entre
   * `/catalogo/13` y `/catalogo/45` (misma configuración de ruta, solo cambia el
   * parámetro), así que `ngOnInit` nunca vuelve a correr con el snapshot: la URL cambiaba
   * pero la página se quedaba mostrando el producto anterior (bug real reportado por el
   * dueño al hacer clic en "También te puede interesar"). Suscribirse a `paramMap` sí
   * reacciona a cada cambio, incluida la carga inicial (emite el valor actual al
   * suscribirse). Se resetea todo el estado dependiente del producto anterior (imagen
   * activa, cantidad, relacionados, aviso de stock) para no arrastrar nada de la vista
   * previa mientras carga la nueva.
   */
  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      window.scrollTo({ top: 0 });
      this.loading.set(true);
      this.notFound.set(false);
      this.product.set(null);
      this.activeImageUrl.set(null);
      this.quantity.set(1);
      this.relatedProducts.set([]);
      this.stockAlertSubmitted.set(false);
      this.stockAlertForm.reset();
      this.catalogService.findProductById(id).subscribe({
        next: (res) => {
          this.product.set(res.data);
          this.activeImageUrl.set(res.data.mainImageUrl);
          this.loading.set(false);
          this.loadRelatedProducts(res.data);
        },
        error: () => {
          this.notFound.set(true);
          this.loading.set(false);
        },
      });
    });
    this.catalogService.getStoreInfo().subscribe({
      next: (res) => this.storeWhatsapp.set(res.data.whatsapp),
      error: () => {},
    });
  }

  private loadRelatedProducts(product: PublicProduct): void {
    if (!product.franchise) return;
    this.catalogService.searchProducts({ franchise: product.franchise, size: 7 }).subscribe({
      next: (res) => this.relatedProducts.set(res.data.content.filter((p) => p.id !== product.id).slice(0, 6)),
      error: () => {},
    });
  }

  back(): void {
    this.router.navigate(['/catalogo']);
  }

  incrementQuantity(): void {
    const max = this.product()?.availableQuantity ?? Infinity;
    this.quantity.update((q) => Math.min(q + 1, max));
  }

  decrementQuantity(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  addToCart(): void {
    const product = this.product();
    if (!product || !product.inStock) return;
    this.cartService.add(product, this.quantity());
    this.snackBar.open(`${product.name} agregado al carrito`, 'Cerrar', { duration: 2500 });
    this.quantity.set(1);
  }

  preorderProgressWidth(info: PublicPreorderInfo): number {
    if (info.totalQuantity <= 0) return 0;
    return Math.min(100, Math.round(((info.totalQuantity - info.availableSlots) / info.totalQuantity) * 100));
  }

  toggleWishlist(): void {
    const product = this.product();
    if (!product) return;
    this.wishlistService.toggle(product);
    this.snackBar.open(this.isWishlisted() ? 'Agregado a favoritos' : 'Quitado de favoritos', 'Cerrar', { duration: 2000 });
  }

  /** true si hay al menos un dato de ficha técnica que mostrar — evita renderizar el bloque completo vacío. */
  hasSpecSheet(p: PublicProduct): boolean {
    return !!(
      p.lineName ||
      p.material ||
      p.hasArticulations !== null ||
      p.includedAccessories ||
      p.packagingMaterial ||
      p.originCountry ||
      p.releaseDate ||
      p.packagedWeightGrams != null
    );
  }

  articulationsLabel(value: boolean | null): string {
    return value === true ? 'Sí' : value === false ? 'No' : '';
  }

  /** "YYYY-MM-DD" -> "DD/MM/YYYY" a mano, nunca new Date()/DatePipe (corrimiento de zona horaria, ver Fase 24/33). */
  formatDate(value: string | null): string {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }

  submitStockAlert(): void {
    const product = this.product();
    if (!product || this.stockAlertForm.invalid) {
      this.stockAlertForm.markAllAsTouched();
      return;
    }
    const v = this.stockAlertForm.getRawValue();
    const request: StockAlertSubmission = { productId: product.id, customerName: v.customerName!, customerPhone: v.customerPhone! };
    this.stockAlertSaving.set(true);
    this.stockAlertService.submit(request).subscribe({
      next: () => {
        this.stockAlertSaving.set(false);
        this.stockAlertSubmitted.set(true);
      },
      error: () => this.stockAlertSaving.set(false),
    });
  }
}
