package com.ramichanstore.backend.modules.sales.dto;

import com.ramichanstore.backend.modules.sales.entity.DeliveryMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.sales.entity.Sale;
import com.ramichanstore.backend.modules.sales.entity.SaleType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record SaleResponse(
        Long id, String orderCode, SaleType type,
        Long customerId, String customerName, String customerPhone, String customerWhatsapp,
        LocalDate saleDate, PaymentMethod paymentMethod, PaymentStatus paymentStatus, DeliveryMethod deliveryMethod,
        LocalDate limitDate, boolean overdue,
        List<SaleItemResponse> items,
        BigDecimal subtotal, BigDecimal total, BigDecimal totalCost, BigDecimal profit, int pointsGenerated,
        BigDecimal amountPaid, BigDecimal balanceDue, List<PaymentResponse> payments,
        String notes, LocalDateTime createdAt) {

    public static SaleResponse from(Sale s) {
        List<SaleItemResponse> items = s.getItems().stream().map(SaleItemResponse::from).toList();
        List<PaymentResponse> payments = s.getPayments().stream().map(PaymentResponse::from).toList();

        BigDecimal amountPaid;
        BigDecimal balanceDue;
        if (s.getType() == SaleType.SEPARACION) {
            amountPaid = payments.stream().map(PaymentResponse::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
            balanceDue = s.getTotal().subtract(amountPaid).max(BigDecimal.ZERO);
        } else {
            amountPaid = s.getPaymentStatus() == PaymentStatus.PAID ? s.getTotal() : BigDecimal.ZERO;
            balanceDue = s.getTotal().subtract(amountPaid);
        }

        boolean overdue = s.getType() == SaleType.SEPARACION && s.getLimitDate() != null
                && (s.getPaymentStatus() == PaymentStatus.PENDING || s.getPaymentStatus() == PaymentStatus.PARTIAL)
                && s.getLimitDate().isBefore(LocalDate.now());

        return new SaleResponse(
                s.getId(), orderCode(s), s.getType(),
                s.getCustomer() != null ? s.getCustomer().getId() : null,
                s.getCustomer() != null ? s.getCustomer().getFullName() : null,
                s.getCustomer() != null ? s.getCustomer().getPhone() : null,
                s.getCustomer() != null ? s.getCustomer().getWhatsapp() : null,
                s.getSaleDate(), s.getPaymentMethod(), s.getPaymentStatus(), s.getDeliveryMethod(),
                s.getLimitDate(), overdue,
                items,
                s.getSubtotal(), s.getTotal(), s.getTotalCost(), s.getProfit(), s.getPointsGenerated(),
                amountPaid, balanceDue, payments,
                s.getNotes(), s.getCreatedAt());
    }

    /** Código legible del pedido, derivado del id — nunca guardado (evita una columna/migración para algo calculable). */
    private static String orderCode(Sale s) {
        return "V-%06d".formatted(s.getId());
    }
}
