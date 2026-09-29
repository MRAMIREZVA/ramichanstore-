package com.ramichanstore.backend.modules.reports.dto;

/** Tráfico del catálogo público en el rango de fechas (Fase 63) — ver CatalogPageViewRepository. */
public record CatalogVisitsSummary(long totalViews, long uniqueVisitors) {
}
