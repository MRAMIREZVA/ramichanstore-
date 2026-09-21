package com.ramichanstore.backend.modules.reports.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Todo lo necesario para armar el reporte de ventas exportado (Excel/PDF/CSV),
 * ya calculado — {@link com.ramichanstore.backend.modules.reports.export.ReportExportService}
 * solo se encarga de escribirlo en el formato pedido, nunca de calcular nada.
 */
public record ReportExportData(
        String storeName, LocalDate from, LocalDate to,
        BigDecimal totalSales, BigDecimal totalProfit, long salesCount, BigDecimal averageTicket,
        List<SaleExportRow> sales,
        List<DailySalesPoint> dailySales,
        List<TopProductPoint> topProducts,
        List<TopCategoryPoint> topCategories) {
}
