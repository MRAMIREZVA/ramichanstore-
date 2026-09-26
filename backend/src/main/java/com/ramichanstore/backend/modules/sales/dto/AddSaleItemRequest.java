package com.ramichanstore.backend.modules.sales.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Agrega un producto NUEVO a una venta ya creada (ej. el cliente decide llevar una figura más
 * mientras se revisa su pedido) — a diferencia de {@link UpdateSaleItemsRequest}, que solo
 * corrige precio/descuento de líneas EXISTENTES sin tocar stock, esto sí descuenta inventario
 * para la cantidad agregada (ver SaleService.addItem).
 */
public record AddSaleItemRequest(
        @NotNull(message = "El producto es obligatorio") Long productId,
        @NotNull(message = "La cantidad es obligatoria") @Min(1) Integer quantity,
        @NotNull(message = "El precio unitario es obligatorio") @DecimalMin(value = "0", inclusive = true) BigDecimal unitPrice,
        @NotNull(message = "El descuento es obligatorio") @DecimalMin(value = "0", inclusive = true) BigDecimal discount) {
}
