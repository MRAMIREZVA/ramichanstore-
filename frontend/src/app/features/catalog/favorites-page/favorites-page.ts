import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WishlistItem, WishlistService } from '../../../core/services/wishlist.service';
import { resolveImageUrl } from '../../../core/utils/image-url';

/**
 * "Favoritos" del catálogo público (Fase 44) — sin cuenta, misma lógica de
 * localStorage que el carrito. Solo enlaza al detalle real del producto para
 * agregar al carrito (nunca desde acá directo): el snapshot que guarda
 * WishlistService no tiene stock/disponibilidad actualizados, y el proyecto
 * nunca sirve un precio/stock viejo con la red disponible (lección de Fase 39).
 */
@Component({
  selector: 'app-favorites-page',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './favorites-page.html',
  styleUrl: './favorites-page.scss',
})
export class FavoritesPage {
  readonly wishlistService = inject(WishlistService);
  readonly resolveImageUrl = resolveImageUrl;
  readonly items = this.wishlistService.items;

  remove(item: WishlistItem): void {
    this.wishlistService.remove(item.productId);
  }
}
