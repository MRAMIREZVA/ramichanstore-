package com.ramichanstore.backend.modules.catalog.dto;

import java.math.BigDecimal;

/**
 * Datos públicos de la tienda (catálogo + login del portal). {@code whatsapp},
 * {@code bannerUrl}, {@code announcementImageUrl}, {@code freeShippingThreshold},
 * {@code googleAnalyticsId} y {@code metaPixelId} son null si el admin no los
 * configuró — el frontend cae al texto/degradado por defecto o simplemente no
 * muestra el popup/banner/inyecta el script de tracking en ese caso, nunca a un
 * enlace/imagen rota ni a un banner con un monto inventado.
 */
public record StoreInfoResponse(
        String storeName, String whatsapp, String bannerUrl, String announcementImageUrl,
        BigDecimal freeShippingThreshold, String googleAnalyticsId, String metaPixelId,
        String yapeNumber, String yapeHolderName) {
}
