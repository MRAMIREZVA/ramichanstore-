package com.ramichanstore.backend.modules.products.dto;

import com.ramichanstore.backend.modules.products.entity.ProductImage;

public record ProductImageResponse(Long id, String fileName, boolean isMain, int sortOrder, String url) {
    public static ProductImageResponse from(ProductImage image) {
        return new ProductImageResponse(
                image.getId(),
                image.getFileName(),
                image.isMain(),
                image.getSortOrder(),
                "/api/products/images/" + image.getId() + "/file");
    }

    /** Fase 78 — misma forma que {@link #from}, a partir de la proyección liviana sin {@code imageData}. */
    public static ProductImageResponse fromSummary(ProductImageSummary summary) {
        return new ProductImageResponse(
                summary.getId(),
                summary.getFileName(),
                summary.isMain(),
                summary.getSortOrder(),
                "/api/products/images/" + summary.getId() + "/file");
    }
}
