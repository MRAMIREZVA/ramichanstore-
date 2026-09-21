package com.ramichanstore.backend.modules.preorders.dto;

import com.ramichanstore.backend.modules.customers.entity.Customer;
import com.ramichanstore.backend.modules.preorders.entity.PreorderCustomer;
import com.ramichanstore.backend.modules.preorders.entity.PreorderStatus;
import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.entity.ProductImage;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Reserva de un cliente dentro de una campaña. Los campos de producto/estado
 * de campaña (agregados para la vista "Pedidos" — sección 9, roadmap) son
 * redundantes cuando ya se está viendo la campaña (un solo `listReservations`
 * por campaña, Fase 4), pero imprescindibles para {@code searchReservations}
 * (todas las reservas de todas las campañas juntas).
 */
public record PreorderCustomerResponse(
        Long id, Long preorderId,
        Long customerId, String customerName, String customerPhone, String customerWhatsapp,
        String productSku, String productName, String productMainImageUrl,
        PreorderStatus preorderStatus, LocalDate limitDate, LocalDate estimatedArrivalDate,
        int quantity, BigDecimal depositAmount, String notes, LocalDateTime createdAt) {

    public static PreorderCustomerResponse from(PreorderCustomer pc) {
        var preorder = pc.getPreorder();
        var product = preorder.getProduct();
        Customer customer = pc.getCustomer();
        return new PreorderCustomerResponse(
                pc.getId(), preorder.getId(),
                customer.getId(), customer.getFullName(), customer.getPhone(), customer.getWhatsapp(),
                product.getSku(), product.getName(), mainImageUrl(product),
                preorder.getStatus(), preorder.getLimitDate(), preorder.getEstimatedArrivalDate(),
                pc.getQuantity(), pc.getDepositAmount(), pc.getNotes(), pc.getCreatedAt());
    }

    private static String mainImageUrl(Product product) {
        return product.getImages().stream()
                .filter(ProductImage::isMain)
                .map(img -> "/api/products/images/" + img.getId() + "/file")
                .findFirst()
                .orElse(product.getMainImageUrl());
    }
}
