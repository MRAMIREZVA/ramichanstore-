package com.ramichanstore.backend.modules.productlines.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProductLineRequest(
        @NotBlank(message = "El nombre es obligatorio") @Size(max = 100) String name,
        Long brandId,
        @Size(max = 255) String description) {
}
