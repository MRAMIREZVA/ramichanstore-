package com.ramichanstore.backend.modules.reports.dto;

import java.math.BigDecimal;

/** Saldo pendiente de un cliente, desglosado por origen — nunca guardado, siempre sumado al vuelo. */
public record CustomerDebtResponse(
        Long customerId,
        String customerName,
        String customerPhone,
        String customerWhatsapp,
        BigDecimal salesBalance,
        BigDecimal separationsBalance,
        BigDecimal preordersBalance,
        BigDecimal totalBalance) {
}
