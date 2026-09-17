package com.ramichanstore.backend.modules.brands.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BrandRequest(
        @NotBlank(message = "El nombre es obligatorio") @Size(max = 100) String name,
        @Size(max = 255) String description) {
}
