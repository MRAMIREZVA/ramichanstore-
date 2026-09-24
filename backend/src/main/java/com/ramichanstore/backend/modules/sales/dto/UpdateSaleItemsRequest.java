package com.ramichanstore.backend.modules.sales.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

/**
 * Corrige precio unitario/descuento de líneas ya existentes de una venta (ej. un error de
 * tipeo al crearla) — no permite cambiar producto ni cantidad (eso requeriría ajustar stock,
 * fuera de alcance de esta corrección puntual). SaleService.updateItems recalcula
 * subtotal/total/ganancia y el ledger de puntos a partir de los valores corregidos.
 */
public record UpdateSaleItemsRequest(@NotEmpty(message = "Debe incluir al menos una línea") @Valid List<Item> items) {

    public record Item(
            @NotNull(message = "El detalle es obligatorio") Long detailId,
            @NotNull(message = "El precio unitario es obligatorio") @DecimalMin(value = "0", inclusive = true) BigDecimal unitPrice,
            @NotNull(message = "El descuento es obligatorio") @DecimalMin(value = "0", inclusive = true) BigDecimal discount) {
    }
}
