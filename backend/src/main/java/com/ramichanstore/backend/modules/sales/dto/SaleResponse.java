package com.ramichanstore.backend.modules.sales.dto;

import com.ramichanstore.backend.modules.sales.entity.DeliveryMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.sales.entity.Sale;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record SaleResponse(
        Long id,
        Long customerId, String customerName, String customerPhone, String customerWhatsapp,
        LocalDate saleDate, PaymentMethod paymentMethod, PaymentStatus paymentStatus, DeliveryMethod deliveryMethod,
        List<SaleItemResponse> items,
        BigDecimal subtotal, BigDecimal total, BigDecimal totalCost, BigDecimal profit, int pointsGenerated,
        String notes, LocalDateTime createdAt) {

    public static SaleResponse from(Sale s) {
        List<SaleItemResponse> items = s.getItems().stream().map(SaleItemResponse::from).toList();
        return new SaleResponse(
                s.getId(),
                s.getCustomer() != null ? s.getCustomer().getId() : null,
                s.getCustomer() != null ? s.getCustomer().getFullName() : null,
                s.getCustomer() != null ? s.getCustomer().getPhone() : null,
                s.getCustomer() != null ? s.getCustomer().getWhatsapp() : null,
                s.getSaleDate(), s.getPaymentMethod(), s.getPaymentStatus(), s.getDeliveryMethod(),
                items,
                s.getSubtotal(), s.getTotal(), s.getTotalCost(), s.getProfit(), s.getPointsGenerated(),
                s.getNotes(), s.getCreatedAt());
    }
}
