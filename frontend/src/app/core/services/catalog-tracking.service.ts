import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

type CatalogEventType = 'CATALOG_HOME' | 'PRODUCT_VIEW';

const VISITOR_STORAGE_KEY = 'ramichan_visitor_id';

/**
 * Tracking de primera parte del catálogo público (Fase 63) — el dueño pidió ver
 * las visitas al catálogo y las vistas de producto DENTRO del propio sistema
 * (Reportes), no solo en el dashboard de Google Analytics/Meta Pixel
 * (`AnalyticsService`, Fase 47) — son dos cosas deliberadamente separadas, no
 * se unifican en un mismo servicio para no confundir cuál hace qué.
 *
 * Fire-and-forget: el error se ignora a propósito — es telemetría, nunca debe
 * bloquear ni mostrarle nada al visitante si el POST falla (sin conexión,
 * adblocker, etc.).
 */
@Injectable({ providedIn: 'root' })
export class CatalogTrackingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/catalog/track`;

  private memoryVisitorId: string | null = null;

  trackCatalogHome(): void {
    this.send('CATALOG_HOME', null);
  }

  trackProductView(productId: number): void {
    this.send('PRODUCT_VIEW', productId);
  }

  private send(eventType: CatalogEventType, productId: number | null): void {
    this.http.post(this.baseUrl, { eventType, productId, visitorId: this.visitorId() }).subscribe({ error: () => {} });
  }

  /**
   * Id anónimo por navegador, persistido en localStorage — envuelto en try/catch
   * (modo incógnito, storage bloqueado, etc.), mismo patrón defensivo que
   * CartService/WishlistService: si el storage real falla, cae a un id en
   * memoria válido solo para esta carga de página, nunca revienta.
   */
  private visitorId(): string {
    if (this.memoryVisitorId) return this.memoryVisitorId;
    try {
      let id = localStorage.getItem(VISITOR_STORAGE_KEY);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(VISITOR_STORAGE_KEY, id);
      }
      this.memoryVisitorId = id;
    } catch {
      this.memoryVisitorId = crypto.randomUUID();
    }
    return this.memoryVisitorId;
  }
}
