package com.ramichanstore.backend.modules.stockalerts.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Submit público (sin login) desde el detalle de un producto agotado del catálogo. */
public record StockAlertSubmission(
        @NotNull(message = "El producto es obligatorio") Long productId,
        @NotBlank(message = "El nombre es obligatorio") @Size(max = 200) String customerName,
        @NotBlank(message = "El teléfono es obligatorio") @Size(max = 30) String customerPhone) {
}
