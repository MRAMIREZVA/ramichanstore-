package com.ramichanstore.backend.modules.deliveries.dto;

import com.ramichanstore.backend.modules.deliveries.entity.DeliveryItem;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.sales.entity.Sale;
import java.math.BigDecimal;
import java.time.LocalDate;

/** Una compra (venta o separación) incluida en una entrega. */
public record DeliveryItemResponse(
        Long id, String type, Long saleId,
        LocalDate purchaseDate, String summary, BigDecimal total, PaymentStatus paymentStatus) {

    public static DeliveryItemResponse from(DeliveryItem item) {
        Sale sale = item.getSale();
        String summary = sale.getItems().size() == 1
                ? sale.getItems().get(0).getProduct().getName()
                : sale.getItems().size() + " producto(s)";
        return new DeliveryItemResponse(item.getId(), sale.getType().name(), sale.getId(),
                sale.getSaleDate(), summary, sale.getTotal(), sale.getPaymentStatus());
    }
}
