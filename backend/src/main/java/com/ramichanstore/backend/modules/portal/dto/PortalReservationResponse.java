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
        int quantity, BigDecimal depositAmount,
        PreorderStatus preorderStatus, LocalDate limitDate, LocalDate estimatedArrivalDate,
        LocalDateTime reservedAt) {

    public static PortalReservationResponse from(PreorderCustomer pc) {
        var preorder = pc.getPreorder();
        var product = preorder.getProduct();
        return new PortalReservationResponse(
                pc.getId(),
                product.getSku(), product.getName(), mainImageUrl(product),
                pc.getQuantity(), pc.getDepositAmount(),
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
