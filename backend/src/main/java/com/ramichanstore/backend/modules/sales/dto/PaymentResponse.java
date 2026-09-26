package com.ramichanstore.backend.modules.sales.dto;

import com.ramichanstore.backend.modules.sales.entity.Payment;
import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id, Long saleId, BigDecimal amount, PaymentMethod paymentMethod, LocalDate paymentDate,
        String notes, Long userId, String username, LocalDateTime createdAt) {

    public static PaymentResponse from(Payment p) {
        return new PaymentResponse(
                p.getId(), p.getSale().getId(), p.getAmount(), p.getPaymentMethod(), p.getPaymentDate(),
                p.getNotes(), p.getUserId(), p.getUsername(), p.getCreatedAt());
    }
}
