package com.ramichanstore.backend.modules.sales.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record SaleItemRequest(
        @NotNull(message = "El producto es obligatorio") Long productId,
        @NotNull(message = "La cantidad es obligatoria") @Min(1) Integer quantity,
        @NotNull(message = "El precio unitario es obligatorio") @DecimalMin(value = "0", inclusive = true) BigDecimal unitPrice,
        @NotNull(message = "El descuento es obligatorio") @DecimalMin(value = "0", inclusive = true) BigDecimal discount) {
}
