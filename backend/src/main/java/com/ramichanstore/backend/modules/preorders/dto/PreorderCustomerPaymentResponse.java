package com.ramichanstore.backend.modules.preorders.dto;

import com.ramichanstore.backend.modules.preorders.entity.PreorderCustomerPayment;
import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PreorderCustomerPaymentResponse(
        Long id, Long reservationId, BigDecimal amount, PaymentMethod paymentMethod, LocalDate paymentDate,
        String notes, Long userId, String username, LocalDateTime createdAt) {

    public static PreorderCustomerPaymentResponse from(PreorderCustomerPayment p) {
        return new PreorderCustomerPaymentResponse(
                p.getId(), p.getPreorderCustomer().getId(), p.getAmount(), p.getPaymentMethod(), p.getPaymentDate(),
                p.getNotes(), p.getUserId(), p.getUsername(), p.getCreatedAt());
    }
}
