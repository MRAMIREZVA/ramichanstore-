package com.ramichanstore.backend.modules.products.dto;

import java.time.LocalDateTime;

/**
 * Proyección liviana para el sitemap público (Fase 81) — solo lo que una entrada
 * {@code <url>} necesita (id para la URL, fecha para {@code <lastmod>}), nunca el
 * producto completo. Mismo criterio que {@code ProductImageSummary} (Fase 78): evitar
 * cargar más de lo que el caso de uso necesita.
 */
public interface ProductSitemapEntry {
    Long getId();

    LocalDateTime getUpdatedAt();
}
