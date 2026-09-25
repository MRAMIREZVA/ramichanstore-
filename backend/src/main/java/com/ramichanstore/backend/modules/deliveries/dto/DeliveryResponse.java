package com.ramichanstore.backend.modules.deliveries.dto;

import com.ramichanstore.backend.modules.deliveries.entity.Delivery;
import com.ramichanstore.backend.modules.deliveries.entity.DeliveryStatus;
import com.ramichanstore.backend.modules.sales.entity.DeliveryMethod;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DeliveryResponse(
        Long id,
        Long customerId, String customerName, String customerPhone, String customerWhatsapp,
        List<DeliveryItemResponse> items, BigDecimal totalAmount,
        DeliveryMethod deliveryType, String address, String district, String department, String province,
        Long deliveryAgencyId, String deliveryAgencyName,
        String recipientDni, String recipientName, String recipientPhone, String courier,
        LocalDate scheduledDate, DeliveryStatus status, String notes) {

    public static DeliveryResponse from(Delivery d) {
        var customer = d.getCustomer();
        var agency = d.getDeliveryAgency();
        List<DeliveryItemResponse> items = d.getItems().stream().map(DeliveryItemResponse::from).toList();
        BigDecimal totalAmount = items.stream().map(DeliveryItemResponse::total).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new DeliveryResponse(
                d.getId(),
                customer.getId(), customer.getFullName(), customer.getPhone(), customer.getWhatsapp(),
                items, totalAmount,
                d.getDeliveryType(), d.getAddress(), d.getDistrict(), d.getDepartment(), d.getProvince(),
                agency != null ? agency.getId() : null, agency != null ? agency.getName() : null,
                d.getRecipientDni(), d.getRecipientName(), d.getRecipientPhone(), d.getCourier(),
                d.getScheduledDate(), d.getStatus(), d.getNotes());
    }
}
