package com.ramichanstore.backend.modules.sales.entity;

/**
 * Discriminador de una venta: {@code VENTA} (pago de una sola vez, genera puntos de fidelidad)
 * o {@code SEPARACION} (producto ya en stock, pagado en abonos vía el ledger {@link Payment},
 * nunca genera puntos). Antes eran dos entidades/tablas separadas (Sale/Separation) — se
 * fusionaron porque una separación siempre fue, en esencia, "una venta que se paga en abonos".
 * Mismo nombre/valores que {@code PurchaseType} ya usado en el frontend (delivery.model.ts).
 */
public enum SaleType {
    VENTA, SEPARACION
}
