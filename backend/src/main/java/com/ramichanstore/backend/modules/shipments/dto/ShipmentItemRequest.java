package com.ramichanstore.backend.modules.shipments.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ShipmentItemRequest(
        Long id,
        @Size(max = 50) String articleCode,
        @NotBlank(message = "La descripción es obligatoria") @Size(max = 300) String description,
        @NotNull(message = "La cantidad es obligatoria") @Min(1) Integer quantity,
        @NotNull(message = "El peso es obligatorio") @DecimalMin(value = "0", inclusive = true) BigDecimal weight,
        @DecimalMin(value = "0", inclusive = true) BigDecimal cost,
        @DecimalMin(value = "0", inclusive = true) BigDecimal commission,
        @DecimalMin(value = "0", inclusive = true) BigDecimal transactionSurcharge) {
}
