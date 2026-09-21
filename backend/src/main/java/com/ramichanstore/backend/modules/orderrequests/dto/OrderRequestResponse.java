package com.ramichanstore.backend.modules.orderrequests.dto;

import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequest;
import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequestStatus;
import com.ramichanstore.backend.modules.sales.entity.DeliveryMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderRequestResponse(
        Long id,
        String guestName, String guestPhone, String guestWhatsapp, String guestAddress, String guestDistrict,
        PaymentMethod preferredPaymentMethod, DeliveryMethod deliveryMethod, String notes,
        List<OrderRequestItemResponse> items, BigDecimal total,
        OrderRequestStatus status, String rejectionReason, Long convertedSaleId,
        LocalDateTime createdAt) {

    public static OrderRequestResponse from(OrderRequest o) {
        List<OrderRequestItemResponse> items = o.getItems().stream().map(OrderRequestItemResponse::from).toList();
        BigDecimal total = items.stream().map(OrderRequestItemResponse::subtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new OrderRequestResponse(
                o.getId(),
                o.getGuestName(), o.getGuestPhone(), o.getGuestWhatsapp(), o.getGuestAddress(), o.getGuestDistrict(),
                o.getPreferredPaymentMethod(), o.getDeliveryMethod(), o.getNotes(),
                items, total,
                o.getStatus(), o.getRejectionReason(), o.getConvertedSaleId(),
                o.getCreatedAt());
    }
}
