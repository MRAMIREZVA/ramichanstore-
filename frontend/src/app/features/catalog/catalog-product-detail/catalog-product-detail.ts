import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PRODUCT_STATUS_LABELS } from '../../../core/models/product.model';
import { PublicProduct } from '../../../core/models/public-catalog.model';
import { CartService } from '../../../core/services/cart.service';
import { PublicCatalogService } from '../../../core/services/public-catalog.service';
import { resolveImageUrl } from '../../../core/utils/image-url';
import { whatsAppLink } from '../../../core/utils/whatsapp';

@Component({
  selector: 'app-catalog-product-detail',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './catalog-product-detail.html',
  styleUrl: './catalog-product-detail.scss',
})
export class CatalogProductDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(PublicCatalogService);
  private readonly cartService = inject(CartService);
  private readonly snackBar = inject(MatSnackBar);

  readonly resolveImageUrl = resolveImageUrl;
  readonly statusLabels = PRODUCT_STATUS_LABELS;

  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly product = signal<PublicProduct | null>(null);
  readonly activeImageUrl = signal<string | null>(null);
  readonly quantity = signal(1);

  /** null si el admin no configuró STORE_WHATSAPP en Configuración (mismo patrón que catalog-layout/contactWhatsAppUrl). */
  readonly storeWhatsapp = signal<string | null>(null);

  readonly whatsappBuyUrl = computed(() => {
    const product = this.product();
    const phone = this.storeWhatsapp();
    if (!product || !phone || !product.inStock) return null;
    const message = `Hola! Quiero comprar: ${product.name} (S/ ${product.salePrice.toFixed(2)}) x${this.quantity()} — SKU ${product.sku}`;
    return whatsAppLink(phone, message);
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.catalogService.findProductById(id).subscribe({
      next: (res) => {
        this.product.set(res.data);
        this.activeImageUrl.set(res.data.mainImageUrl);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
    this.catalogService.getStoreInfo().subscribe({
      next: (res) => this.storeWhatsapp.set(res.data.whatsapp),
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
}
