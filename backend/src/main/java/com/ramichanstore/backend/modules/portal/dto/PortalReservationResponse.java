package com.ramichanstore.backend.modules.portal.dto;

import com.ramichanstore.backend.modules.preorders.entity.PreorderCustomer;
import com.ramichanstore.backend.modules.preorders.entity.PreorderStatus;
import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.entity.ProductImage;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Ficha de solo lectura de una reserva de preventa, tal como la ve el cliente dueño. */
public record PortalReservationResponse(
        Long id,
        String productSku, String productName, String productMainImageUrl,
        int quantity, BigDecimal depositAmount, BigDecimal totalPrice, BigDecimal amountPaid, BigDecimal balanceDue,
        PreorderStatus preorderStatus, LocalDate limitDate, LocalDate estimatedArrivalDate,
        LocalDateTime reservedAt) {

    /** amountPaid siempre viene de SUM(preorder_customer_payments) — nunca guardado, ver PortalService. */
    public static PortalReservationResponse from(PreorderCustomer pc, BigDecimal amountPaid) {
        var preorder = pc.getPreorder();
        var product = preorder.getProduct();
        BigDecimal totalPrice = product.getSalePrice().multiply(BigDecimal.valueOf(pc.getQuantity()));
        return new PortalReservationResponse(
                pc.getId(),
                product.getSku(), product.getName(), mainImageUrl(product),
                pc.getQuantity(), pc.getDepositAmount(), totalPrice, amountPaid, totalPrice.subtract(amountPaid),
                preorder.getStatus(), preorder.getLimitDate(), preorder.getEstimatedArrivalDate(),
                pc.getCreatedAt());
    }

    private static String mainImageUrl(Product product) {
        return product.getImages().stream()
                .filter(ProductImage::isMain)
                .map(img -> "/api/products/images/" + img.getId() + "/file")
                .findFirst()
                .orElse(product.getMainImageUrl());
    }
}
