import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from '../../../core/services/cart.service';
import { PublicCatalogService } from '../../../core/services/public-catalog.service';
import { whatsAppLink } from '../../../core/utils/whatsapp';

@Component({
  selector: 'app-catalog-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatButtonModule, MatIconModule, MatBadgeModule],
  templateUrl: './catalog-layout.html',
  styleUrl: './catalog-layout.scss',
})
export class CatalogLayout implements OnInit {
  private readonly catalogService = inject(PublicCatalogService);
  private readonly cartService = inject(CartService);

  readonly cartTotalItems = this.cartService.totalItems;

  /** null si el admin no configuró STORE_WHATSAPP en Configuración. */
  readonly contactWhatsAppUrl = signal<string | null>(null);

  ngOnInit(): void {
    this.catalogService.getStoreInfo().subscribe({
      next: (res) => {
        if (!res.data.whatsapp) return;
        const message = `Hola, tengo una consulta sobre el catálogo de ${res.data.storeName}.`;
        this.contactWhatsAppUrl.set(whatsAppLink(res.data.whatsapp, message));
      },
      error: () => {},
    });
  }
}
