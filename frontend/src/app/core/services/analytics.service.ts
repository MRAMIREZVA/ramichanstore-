import { Injectable } from '@angular/core';

/**
 * Google Analytics 4 / Meta Pixel para el catálogo público (pedido explícito del dueño:
 * "cero visibilidad de tráfico/conversión hoy"). Ninguno de los dos se activa por defecto —
 * `CatalogLayout` llama a estos métodos solo si el admin configuró `GOOGLE_ANALYTICS_ID`/
 * `META_PIXEL_ID` en Configuración (mismo criterio que `STORE_WHATSAPP`: vacío = desactivado,
 * nunca un script roto apuntando a un ID inventado). Inyecta los scripts en `<head>` en vez
 * de dejarlos fijos en `index.html` — el ID es un dato de configuración, no del build.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private gaInitialized = false;
  private pixelInitialized = false;

  initGoogleAnalytics(measurementId: string): void {
    if (this.gaInitialized) return;
    this.gaInitialized = true;

    const loader = document.createElement('script');
    loader.async = true;
    loader.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(loader);

    const inline = document.createElement('script');
    inline.text = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}');
    `;
    document.head.appendChild(inline);
  }

  initMetaPixel(pixelId: string): void {
    if (this.pixelInitialized) return;
    this.pixelInitialized = true;

    const inline = document.createElement('script');
    inline.text = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(inline);
  }
}
