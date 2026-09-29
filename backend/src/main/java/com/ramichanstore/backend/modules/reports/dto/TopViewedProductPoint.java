package com.ramichanstore.backend.modules.reports.dto;

/** Calcado de {@link TopProductPoint} pero por vistas de ficha, no por ingresos (Fase 63). */
public record TopViewedProductPoint(Long productId, String productName, long views) {
}
