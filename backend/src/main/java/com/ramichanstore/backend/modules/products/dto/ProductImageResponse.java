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
}
