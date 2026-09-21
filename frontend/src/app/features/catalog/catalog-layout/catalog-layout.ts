import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from '../../../core/services/cart.service';
import { PublicCatalogService } from '../../../core/services/public-catalog.service';
import { resolveImageUrl } from '../../../core/utils/image-url';
import { whatsAppLink } from '../../../core/utils/whatsapp';
import { AnnouncementPopupComponent } from '../announcement-popup/announcement-popup';

/** sessionStorage, no localStorage a propósito: el anuncio debe volver a mostrarse en cada visita nueva (nueva pestaña/sesión), no solo una vez por siempre en el navegador. */
const ANNOUNCEMENT_SEEN_KEY = 'ramichan_catalog_announcement_seen';

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
  private readonly dialog = inject(MatDialog);

  readonly cartTotalItems = this.cartService.totalItems;

  /** null si el admin no configuró STORE_WHATSAPP en Configuración. */
  readonly contactWhatsAppUrl = signal<string | null>(null);

  ngOnInit(): void {
    this.catalogService.getStoreInfo().subscribe({
      next: (res) => {
        if (res.data.whatsapp) {
          const message = `Hola, tengo una consulta sobre el catálogo de ${res.data.storeName}.`;
          this.contactWhatsAppUrl.set(whatsAppLink(res.data.whatsapp, message));
        }
        this.maybeShowAnnouncement(res.data.announcementImageUrl);
      },
      error: () => {},
    });
  }

  private maybeShowAnnouncement(announcementImageUrl: string | null): void {
    if (!announcementImageUrl) return;
    try {
      if (sessionStorage.getItem(ANNOUNCEMENT_SEEN_KEY)) return;
      sessionStorage.setItem(ANNOUNCEMENT_SEEN_KEY, '1');
    } catch {
      // sessionStorage no disponible (modo incógnito estricto, etc.) — se muestra igual, sin recordar.
    }
    this.dialog.open(AnnouncementPopupComponent, {
      data: { imageUrl: resolveImageUrl(announcementImageUrl)! },
      panelClass: 'announcement-dialog-panel',
      maxWidth: '90vw',
      autoFocus: false,
    });
  }
}
