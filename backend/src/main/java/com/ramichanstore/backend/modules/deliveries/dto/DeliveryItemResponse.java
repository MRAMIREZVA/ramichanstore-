package com.ramichanstore.backend.modules.deliveries.dto;

import com.ramichanstore.backend.modules.deliveries.entity.DeliveryItem;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

/** Una compra (venta o separación, nunca ambas) incluida en una entrega. */
public record DeliveryItemResponse(
        Long id, String type, Long saleId, Long separationId,
        LocalDate purchaseDate, String summary, BigDecimal total, PaymentStatus paymentStatus) {

    public static DeliveryItemResponse from(DeliveryItem item) {
        if (item.getSale() != null) {
            var sale = item.getSale();
            return new DeliveryItemResponse(item.getId(), "VENTA", sale.getId(), null,
                    sale.getSaleDate(), sale.getItems().size() + " producto(s)", sale.getTotal(), sale.getPaymentStatus());
        }
        var separation = item.getSeparation();
        return new DeliveryItemResponse(item.getId(), "SEPARACION", null, separation.getId(),
                separation.getSeparationDate(), separation.getProduct().getName(), separation.getTotalPrice(),
                separation.getStatus());
    }
}
