package com.ramichanstore.backend.modules.orderrequests.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

/**
 * El admin declara el depósito REAL que recibió por cada línea del pedido web
 * (una preventa siempre exige un depósito de verdad — nunca se inventa un
 * monto solo por convertir automáticamente, a diferencia de una venta que
 * puede nacer con pago PENDING). Un depósito por ítem porque el carrito puede
 * traer varios productos en preventa distintos, cada uno contra su propia
 * campaña — ver OrderRequestService.convertToReservations.
 */
public record ConvertToReservationsRequest(
        @NotEmpty(message = "Debe indicar el depósito de al menos un ítem") @Valid List<ItemDeposit> deposits) {

    public record ItemDeposit(
            @NotNull(message = "El ítem es obligatorio") Long itemId,
            @NotNull(message = "El depósito es obligatorio") @DecimalMin(value = "0", inclusive = true) BigDecimal depositAmount) {
    }
}
