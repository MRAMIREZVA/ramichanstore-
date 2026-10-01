package com.ramichanstore.backend.modules.reports.dto;

import java.math.BigDecimal;

/**
 * Snapshot (sin rango de fechas, igual que "Cuentas por cobrar") de cuánto vale el stock actual.
 * {@code stockValueAtCost} está subestimado mientras {@code productsWithoutCost} sea alto — un
 * producto con costo en S/0 aporta S/0 a esa suma aunque sí tenga stock real, así que el reporte
 * expone ese conteo para que nunca se lea el valor a costo como si fuera confiable por sí solo.
 */
public record InventoryValuationResponse(
        BigDecimal stockValueAtCost,
        BigDecimal stockValueAtSalePrice,
        BigDecimal potentialProfit,
        long totalProducts,
        long productsWithoutCost) {
}
