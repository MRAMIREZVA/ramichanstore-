package com.ramichanstore.backend.modules.preorders.dto;

import com.ramichanstore.backend.modules.preorders.entity.Preorder;
import com.ramichanstore.backend.modules.preorders.entity.PreorderStatus;
import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.entity.ProductImage;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Los campos de producto (nombre, imagen, línea, marca, tamaño, precio, costo,
 * ganancia estimada) se leen de {@code Product} — nunca se duplican en `preorders`.
 */
public record PreorderResponse(
        Long id,
        Long productId, String productSku, String productName, String productMainImageUrl,
        String lineName, String brandName, String size,
        BigDecimal salePrice, BigDecimal estimatedCost, BigDecimal estimatedProfit,
        BigDecimal minDepositAmount,
        LocalDate startDate, LocalDate limitDate, LocalDate estimatedArrivalDate,
        int availableQuantity, int reservedQuantity, int availableSlots,
        PreorderStatus status, String notes) {

    public static PreorderResponse from(Preorder p, int reservedQuantity) {
        var product = p.getProduct();
        return new PreorderResponse(
                p.getId(),
                product.getId(), product.getSku(), product.getName(), mainImageUrl(product),
                product.getLine() != null ? product.getLine().getName() : null,
                product.getBrand().getName(), product.getSize(),
                product.getSalePrice(), product.getTotalCost(), product.getProfit(),
                p.getMinDepositAmount(),
                p.getStartDate(), p.getLimitDate(), p.getEstimatedArrivalDate(),
                p.getAvailableQuantity(), reservedQuantity, Math.max(0, p.getAvailableQuantity() - reservedQuantity),
                p.getStatus(), p.getNotes());
    }

    private static String mainImageUrl(Product product) {
        return product.getImages().stream()
                .filter(ProductImage::isMain)
                .map(img -> "/api/products/images/" + img.getId() + "/file")
                .findFirst()
                .orElse(product.getMainImageUrl());
    }
}
