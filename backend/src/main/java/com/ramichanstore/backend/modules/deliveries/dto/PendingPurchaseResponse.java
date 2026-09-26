package com.ramichanstore.backend.modules.deliveries.dto;

import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.sales.entity.Sale;
import java.math.BigDecimal;
import java.time.LocalDate;

/** Una venta (VENTA o SEPARACION) de un cliente candidata a incluirse en una entrega nueva o existente. */
public record PendingPurchaseResponse(
        String type, Long id, LocalDate purchaseDate, String summary, BigDecimal total, PaymentStatus paymentStatus) {

    public static PendingPurchaseResponse fromSale(Sale s) {
        String summary = s.getItems().size() == 1
                ? s.getItems().get(0).getProduct().getName()
                : s.getItems().size() + " producto(s)";
        return new PendingPurchaseResponse(s.getType().name(), s.getId(), s.getSaleDate(), summary, s.getTotal(), s.getPaymentStatus());
    }
}
