import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PRODUCT_STATUS_LABELS } from '../../../core/models/product.model';
import { PublicProduct } from '../../../core/models/public-catalog.model';
import { CartService } from '../../../core/services/cart.service';
import { PublicCatalogService } from '../../../core/services/public-catalog.service';
import { resolveImageUrl } from '../../../core/utils/image-url';

@Component({
  selector: 'app-catalog-product-detail',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule],
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
  }

  back(): void {
    this.router.navigate(['/catalogo']);
  }

  incrementQuantity(): void {
    this.quantity.update((q) => q + 1);
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
