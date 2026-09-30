package com.ramichanstore.backend.modules.reports.dto;

/** Calcado de {@link TopProductPoint} pero por cantidad reservada en preventa, no por ingresos de Ventas. */
public record TopReservedProductPoint(Long productId, String productName, long quantityReserved) {
}
