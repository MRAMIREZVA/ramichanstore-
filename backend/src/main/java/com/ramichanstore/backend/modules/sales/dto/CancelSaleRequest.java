package com.ramichanstore.backend.modules.sales.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelSaleRequest(@NotBlank(message = "El motivo de cancelación es obligatorio") @Size(max = 255) String reason) {
}
