package com.ramichanstore.backend.modules.reports.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Una fila de la tabla "Ventas detalladas" en los reportes exportados (Excel/CSV). */
public record SaleExportRow(
        String orderCode, LocalDate saleDate, String customerName,
        BigDecimal total, BigDecimal profit, String paymentStatus) {
}
