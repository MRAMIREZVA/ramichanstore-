package com.ramichanstore.backend.modules.orderrequests.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CartItemRequest(
        @NotNull(message = "El producto es obligatorio") Long productId,
        @NotNull(message = "La cantidad es obligatoria") @Min(1) Integer quantity) {
}
