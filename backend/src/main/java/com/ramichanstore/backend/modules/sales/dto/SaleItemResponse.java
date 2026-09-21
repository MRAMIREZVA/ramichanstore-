package com.ramichanstore.backend.modules.sales.dto;

import com.ramichanstore.backend.modules.sales.entity.SaleDetail;
import java.math.BigDecimal;

public record SaleItemResponse(
        Long id, Long productId, String productSku, String productName,
        int quantity, BigDecimal unitPrice, BigDecimal discount, BigDecimal unitCost, BigDecimal subtotal) {

    public static SaleItemResponse from(SaleDetail d) {
        return new SaleItemResponse(
                d.getId(), d.getProduct().getId(), d.getProduct().getSku(), d.getProduct().getName(),
                d.getQuantity(), d.getUnitPrice(), d.getDiscount(), d.getUnitCost(), d.getSubtotal());
    }
}
