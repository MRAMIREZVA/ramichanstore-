package com.ramichanstore.backend.modules.products.dto;

import com.ramichanstore.backend.modules.products.entity.ProductStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO de creación/edición de producto. Deliberadamente NO incluye totalCost,
 * profit ni marginPercent: esos siempre los calcula ProductService.
 */
public record ProductRequest(
        @NotBlank(message = "El SKU es obligatorio") @Size(max = 50) String sku,
        @NotBlank(message = "El nombre es obligatorio") @Size(max = 200) String name,
        @Size(max = 150) String characterName,
        @Size(max = 150) String franchise,
        @NotNull(message = "La marca es obligatoria") Long brandId,
        @NotNull(message = "La categoría es obligatoria") Long categoryId,
        Long lineId,
        String description,
        @Size(max = 500) String mainImageUrl,
        List<@Size(max = 500) String> additionalImageUrls,
        @Size(max = 100) String size,
        @NotNull(message = "El precio de compra es obligatorio") @DecimalMin(value = "0", inclusive = true) BigDecimal purchasePrice,
        @NotNull(message = "Los gastos adicionales son obligatorios") @DecimalMin(value = "0", inclusive = true) BigDecimal additionalCosts,
        @NotNull(message = "El precio de venta es obligatorio") @DecimalMin(value = "0.01") BigDecimal salePrice,
        @NotNull @Min(0) Integer currentStock,
        @NotNull @Min(0) Integer minStock,
        @NotNull ProductStatus status,
        @Size(max = 100) String location,
        LocalDate entryDate,
        Long supplierId,
        @Size(max = 500) String notes) {
}
