package com.ramichanstore.backend.modules.preorders.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/** Corrige el precio unitario de una reserva ya creada — ver PreorderService.updateUnitPrice. */
public record UpdateReservationPriceRequest(
        @NotNull(message = "El precio unitario es obligatorio") @DecimalMin(value = "0", inclusive = true) BigDecimal unitPrice) {
}
