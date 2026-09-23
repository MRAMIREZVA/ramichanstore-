package com.ramichanstore.backend.modules.sales.dto;

import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import jakarta.validation.constraints.NotNull;

/**
 * PENDING/PARTIAL/PAID solamente — CANCELLED se maneja aparte con
 * POST /{id}/cancel (revierte stock y puntos), nunca por acá. Ver
 * SaleService.updatePaymentStatus.
 */
public record UpdateSalePaymentStatusRequest(@NotNull PaymentStatus status) {
}
