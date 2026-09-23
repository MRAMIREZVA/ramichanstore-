import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-catalog-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MatButtonModule, MatIconModule, MatBadgeModule],
  templateUrl: './catalog-layout.html',
  styleUrl: './catalog-layout.scss',
})
export class CatalogLayout implements OnInit, OnDestroy {
  private readonly catalogService = inject(PublicCatalogService);
  private readonly cartService = inject(CartService);
  private readonly dialog = inject(MatDialog);

  readonly cartTotalItems = this.cartService.totalItems;

  /** null si el admin no configuró STORE_WHATSAPP en Configuración. */
  readonly contactWhatsAppUrl = signal<string | null>(null);

  ngOnInit(): void {
    // Un mat-dialog/mat-select abierto desde acá se renderiza en el
    // cdk-overlay-container (cuelga de <body>, no de .catalog-shell) — este
    // toggle es lo que hace que esos overlays también usen la tipografía de
    // marca (ver styles.scss, Fase 29).
    document.body.classList.add('catalog-scope');
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

  ngOnDestroy(): void {
    document.body.classList.remove('catalog-scope');
  }

  /**
   * El link del catálogo se comparte directamente a clientes (no es un flujo de
   * "visita una vez" tipo SPA) — a propósito se muestra en CADA carga/recarga de
   * la página, no solo la primera vez por sesión, para que la promoción/noticia
   * tenga la mayor visibilidad posible cada vez que alguien abre el link.
   */
  private maybeShowAnnouncement(announcementImageUrl: string | null): void {
    if (!announcementImageUrl) return;
    this.dialog.open(AnnouncementPopupComponent, {
      data: { imageUrl: resolveImageUrl(announcementImageUrl)! },
      panelClass: 'announcement-dialog-panel',
      maxWidth: '90vw',
      autoFocus: false,
    });
  }
}
