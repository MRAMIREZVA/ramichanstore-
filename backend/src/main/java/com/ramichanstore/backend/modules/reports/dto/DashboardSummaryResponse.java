package com.ramichanstore.backend.modules.reports.dto;

import java.math.BigDecimal;

public record DashboardSummaryResponse(
        BigDecimal salesTodayTotal, long salesTodayCount,
        BigDecimal salesMonthTotal, long salesMonthCount,
        BigDecimal profitMonth,
        long productsRegistered, long lowStockCount,
        long activePreorders, long upcomingPreorders,
        long registeredCustomers,
        int pointsIssuedMonth,
        long pendingPaymentsCount, BigDecimal pendingPaymentsBalance,
        /**
         * Alertas operativas (Fase 82) — cada una queda en 0 si el usuario autenticado no tiene
         * el permiso de VER ese módulo (ver ReportService.hasAuthority), nunca por falta de datos
         * reales; el frontend no distingue ambos casos a propósito (simplemente no muestra la fila).
         */
        long lateDeliveries, long overduePreorders, long pendingWebOrders, long customsFlaggedShipments) {
}
