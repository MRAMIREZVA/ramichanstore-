package com.ramichanstore.backend.modules.products.dto;

import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.entity.ProductStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ProductResponse(
        Long id, String sku, String name, String characterName, String franchise,
        Long brandId, String brandName,
        Long categoryId, String categoryName,
        Long lineId, String lineName,
        String description, String mainImageUrl, List<ProductImageResponse> images,
        String size,
        BigDecimal purchasePrice, BigDecimal additionalCosts, BigDecimal totalCost,
        BigDecimal salePrice, BigDecimal profit, BigDecimal marginPercent,
        int currentStock, int minStock, boolean lowStock,
        ProductStatus status, String location, LocalDate entryDate,
        Long supplierId, String supplierName, String notes) {

    public static ProductResponse from(Product p) {
        List<ProductImageResponse> images = p.getImages().stream().map(ProductImageResponse::from).toList();
        String mainImageUrl = images.stream()
                .filter(ProductImageResponse::isMain)
                .map(ProductImageResponse::url)
                .findFirst()
                .orElse(p.getMainImageUrl());

        return new ProductResponse(
                p.getId(), p.getSku(), p.getName(), p.getCharacterName(), p.getFranchise(),
                p.getBrand().getId(), p.getBrand().getName(),
                p.getCategory().getId(), p.getCategory().getName(),
                p.getLine() != null ? p.getLine().getId() : null,
                p.getLine() != null ? p.getLine().getName() : null,
                p.getDescription(), mainImageUrl, images,
                p.getSize(),
                p.getPurchasePrice(), p.getAdditionalCosts(), p.getTotalCost(),
                p.getSalePrice(), p.getProfit(), p.getMarginPercent(),
                p.getCurrentStock(), p.getMinStock(), p.isLowStock(),
                p.getStatus(), p.getLocation(), p.getEntryDate(),
                p.getSupplier() != null ? p.getSupplier().getId() : null,
                p.getSupplier() != null ? p.getSupplier().getName() : null,
                p.getNotes());
    }
}
