package com.ramichanstore.backend.modules.preorders.dto;

import com.ramichanstore.backend.modules.preorders.entity.PreorderCustomer;
import com.ramichanstore.backend.modules.preorders.entity.PreorderStatus;
import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.entity.ProductImage;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Reserva de un cliente vista desde el admin (ficha del cliente), con el
 * producto y el estado de SU campaña — a diferencia de {@link PreorderCustomerResponse}
 * (reservas de UNA campaña, donde el producto ya es obvio por contexto), acá
 * un mismo cliente puede tener reservas de varias campañas distintas a la vez.
 */
public record CustomerReservationResponse(
        Long id, Long preorderId,
        String productSku, String productName, String productMainImageUrl,
        int quantity, BigDecimal depositAmount,
        PreorderStatus preorderStatus, LocalDate limitDate, LocalDate estimatedArrivalDate,
        LocalDateTime createdAt) {

    public static CustomerReservationResponse from(PreorderCustomer pc) {
        var preorder = pc.getPreorder();
        var product = preorder.getProduct();
        return new CustomerReservationResponse(
                pc.getId(), preorder.getId(),
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
