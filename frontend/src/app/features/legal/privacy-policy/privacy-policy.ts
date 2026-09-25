import { Component, OnInit, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { PublicCatalogService } from '../../../core/services/public-catalog.service';
import { whatsAppLink } from '../../../core/utils/whatsapp';

/**
 * Política de Privacidad — página legal pública, sin login, enlazada desde el
 * catálogo, el portal de clientes y el login del portal. Vive en su propia
 * ruta de nivel superior (`/privacidad`, ver app.routes.ts) en vez de anidarse
 * bajo `/catalogo` o `/portal`, porque debe ser accesible desde ambos sin
 * depender de ninguno de los dos layouts — y porque `/catalogo/:id` captura
 * cualquier segmento como id de producto (ver Fase 18), así que anidarla ahí
 * habría chocado con esa ruta comodín.
 */
@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy implements OnInit {
  private readonly catalogService = inject(PublicCatalogService);
  private readonly location = inject(Location);

  readonly storeName = signal('RamichanStore');
  readonly contactWhatsAppUrl = signal<string | null>(null);

  ngOnInit(): void {
    this.catalogService.getStoreInfo().subscribe({
      next: (res) => {
        this.storeName.set(res.data.storeName || 'RamichanStore');
        if (res.data.whatsapp) {
          const message = `Hola, tengo una consulta sobre el tratamiento de mis datos personales en ${res.data.storeName}.`;
          this.contactWhatsAppUrl.set(whatsAppLink(res.data.whatsapp, message));
        }
      },
      error: () => {},
    });
  }

  goBack(): void {
    this.location.back();
  }
}
