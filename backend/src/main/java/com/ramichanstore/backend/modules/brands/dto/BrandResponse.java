package com.ramichanstore.backend.modules.brands.dto;

import com.ramichanstore.backend.modules.brands.entity.Brand;

public record BrandResponse(Long id, String name, String description) {
    public static BrandResponse from(Brand brand) {
        return new BrandResponse(brand.getId(), brand.getName(), brand.getDescription());
    }
}
