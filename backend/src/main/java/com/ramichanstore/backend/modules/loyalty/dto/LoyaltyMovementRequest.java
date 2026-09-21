package com.ramichanstore.backend.modules.loyalty.dto;

import com.ramichanstore.backend.modules.loyalty.entity.LoyaltyMovementType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Endpoint manual: solo admite CANJE, AJUSTE_MANUAL o BONIFICACION. COMPRA lo
 * genera automáticamente {@code SaleService} al registrar una venta —
 * permitirlo aquí abriría la puerta a puntos duplicados o inconsistentes.
 */
public record LoyaltyMovementRequest(
        @NotNull(message = "El cliente es obligatorio") Long customerId,
        @NotNull(message = "El tipo de movimiento es obligatorio") LoyaltyMovementType movementType,
        @NotNull(message = "Los puntos son obligatorios") Integer points,
        @NotBlank(message = "El motivo es obligatorio") @Size(max = 255) String reason) {
}
