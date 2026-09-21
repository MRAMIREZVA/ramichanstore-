package com.ramichanstore.backend.modules.separations.dto;

import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import com.ramichanstore.backend.modules.separations.entity.Payment;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id, Long separationId, BigDecimal amount, PaymentMethod paymentMethod, LocalDate paymentDate,
        String notes, Long userId, String username, LocalDateTime createdAt) {

    public static PaymentResponse from(Payment p) {
        return new PaymentResponse(
                p.getId(), p.getSeparation().getId(), p.getAmount(), p.getPaymentMethod(), p.getPaymentDate(),
                p.getNotes(), p.getUserId(), p.getUsername(), p.getCreatedAt());
    }
}
