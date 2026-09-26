package com.ramichanstore.backend.modules.reports.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Una reserva de preventa activa (campaña ni DELIVERED ni CANCELLED) — una fila por reserva, no por cliente. */
public record CustomerActivePreorderResponse(
        Long customerId,
        String customerName,
        String customerPhone,
        String customerWhatsapp,
        Long reservationId,
        String productSku,
        String productName,
        int quantity,
        BigDecimal totalPrice,
        BigDecimal amountPaid,
        BigDecimal balanceDue,
        String preorderStatus,
        LocalDate estimatedArrivalDate) {
}
