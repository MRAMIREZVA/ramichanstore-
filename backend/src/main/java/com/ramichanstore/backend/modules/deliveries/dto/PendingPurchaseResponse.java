package com.ramichanstore.backend.modules.deliveries.dto;

import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.sales.entity.Sale;
import com.ramichanstore.backend.modules.separations.entity.Separation;
import java.math.BigDecimal;
import java.time.LocalDate;

/** Compra (venta o separación) de un cliente candidata a incluirse en una entrega nueva o existente. */
public record PendingPurchaseResponse(
        String type, Long id, LocalDate purchaseDate, String summary, BigDecimal total, PaymentStatus paymentStatus) {

    public static PendingPurchaseResponse fromSale(Sale s) {
        return new PendingPurchaseResponse("VENTA", s.getId(), s.getSaleDate(),
                s.getItems().size() + " producto(s)", s.getTotal(), s.getPaymentStatus());
    }

    public static PendingPurchaseResponse fromSeparation(Separation s) {
        return new PendingPurchaseResponse("SEPARACION", s.getId(), s.getSeparationDate(),
                s.getProduct().getName(), s.getTotalPrice(), s.getStatus());
    }
}
