package com.ramichanstore.backend.modules.separations.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record SeparationRequest(
        @NotNull(message = "El cliente es obligatorio") Long customerId,
        @NotNull(message = "El producto es obligatorio") Long productId,
        @NotNull(message = "La cantidad es obligatoria") @Min(1) Integer quantity,
        @NotNull(message = "El precio total es obligatorio") @DecimalMin(value = "0.01") BigDecimal totalPrice,
        @NotNull(message = "La fecha de separación es obligatoria") LocalDate separationDate,
        @NotNull(message = "La fecha límite es obligatoria") LocalDate limitDate,
        @Size(max = 500) String notes) {
}
