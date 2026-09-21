package com.ramichanstore.backend.modules.catalog.dto;

/**
 * Datos públicos de la tienda (catálogo + login del portal). {@code whatsapp} y
 * {@code bannerUrl} son null si el admin no los configuró — el frontend cae al
 * texto/degradado por defecto en ese caso, nunca a un enlace roto.
 */
public record StoreInfoResponse(String storeName, String whatsapp, String bannerUrl) {
}
