package com.ramichanstore.backend.modules.shipments.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ShipmentItemRequest(
        @Size(max = 50) String articleCode,
        @NotBlank(message = "La descripción es obligatoria") @Size(max = 300) String description,
        @NotNull(message = "La cantidad es obligatoria") @Min(1) Integer quantity) {
}
