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
        long pendingPaymentsCount, BigDecimal pendingPaymentsBalance) {
}
