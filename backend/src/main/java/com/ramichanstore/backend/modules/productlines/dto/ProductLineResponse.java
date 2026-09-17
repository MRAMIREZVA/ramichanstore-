package com.ramichanstore.backend.modules.productlines.dto;

import com.ramichanstore.backend.modules.productlines.entity.ProductLine;

public record ProductLineResponse(Long id, String name, Long brandId, String brandName, String description) {
    public static ProductLineResponse from(ProductLine line) {
        return new ProductLineResponse(
                line.getId(),
                line.getName(),
                line.getBrand() != null ? line.getBrand().getId() : null,
                line.getBrand() != null ? line.getBrand().getName() : null,
                line.getDescription());
    }
}
