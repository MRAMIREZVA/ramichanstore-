package com.ramichanstore.backend.modules.catalog.dto;

/**
 * Datos públicos de la tienda (catálogo + login del portal). {@code whatsapp},
 * {@code bannerUrl} y {@code announcementImageUrl} son null si el admin no los
 * configuró — el frontend cae al texto/degradado por defecto o simplemente no
 * muestra el popup de bienvenida en ese caso, nunca a un enlace/imagen rota.
 */
public record StoreInfoResponse(String storeName, String whatsapp, String bannerUrl, String announcementImageUrl) {
}
