package com.ramichanstore.backend.modules.orderrequests.dto;

import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequest;
import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequestStatus;
import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequestType;
import com.ramichanstore.backend.modules.sales.entity.DeliveryMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderRequestResponse(
        Long id,
        String guestName, String guestPhone, String guestWhatsapp, String guestAddress, String guestDistrict,
        String guestProvince, String guestDepartment,
        PaymentMethod preferredPaymentMethod, DeliveryMethod deliveryMethod,
        Long deliveryAgencyId, String deliveryAgencyName,
        String recipientDni, String recipientName, String recipientPhone,
        String notes,
        List<OrderRequestItemResponse> items, BigDecimal total,
        OrderRequestType requestType, OrderRequestStatus status, String rejectionReason, Long convertedSaleId,
        LocalDateTime createdAt) {

    public static OrderRequestResponse from(OrderRequest o) {
        List<OrderRequestItemResponse> items = o.getItems().stream().map(OrderRequestItemResponse::from).toList();
        BigDecimal total = items.stream().map(OrderRequestItemResponse::subtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        var agency = o.getDeliveryAgency();
        return new OrderRequestResponse(
                o.getId(),
                o.getGuestName(), o.getGuestPhone(), o.getGuestWhatsapp(), o.getGuestAddress(), o.getGuestDistrict(),
                o.getGuestProvince(), o.getGuestDepartment(),
                o.getPreferredPaymentMethod(), o.getDeliveryMethod(),
                agency != null ? agency.getId() : null, agency != null ? agency.getName() : null,
                o.getRecipientDni(), o.getRecipientName(), o.getRecipientPhone(),
                o.getNotes(),
                items, total,
                o.getRequestType(), o.getStatus(), o.getRejectionReason(), o.getConvertedSaleId(),
                o.getCreatedAt());
    }
}
