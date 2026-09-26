package com.ramichanstore.backend.modules.reports.dto;

import java.util.List;

/** "Cuentas por cobrar": clientes con saldo pendiente (Ventas+Separaciones+Preventas) y quiénes tienen preventas activas. */
public record ReceivablesReportResponse(
        List<CustomerDebtResponse> customersWithDebt,
        List<CustomerActivePreorderResponse> activePreorders) {
}
