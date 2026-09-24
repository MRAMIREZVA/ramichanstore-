package com.ramichanstore.backend.modules.preorders.dto;

import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * {@code unitPrice} es opcional a propósito: si no se envía, {@link com.ramichanstore.backend
 * .modules.preorders.service.PreorderService#addReservation} lo completa con el precio de
 * catálogo vigente del producto — el admin solo necesita escribir uno distinto para los clientes
 * que reservaron con precio de preventa/descuento.
 */
public record PreorderCustomerRequest(
        @NotNull(message = "El cliente es obligatorio") Long customerId,
        @NotNull(message = "La cantidad es obligatoria") @Min(1) Integer quantity,
        @NotNull(message = "El monto de separación es obligatorio") @DecimalMin(value = "0", inclusive = true) BigDecimal depositAmount,
        @NotNull(message = "El método de pago es obligatorio") PaymentMethod paymentMethod,
        @DecimalMin(value = "0", inclusive = true) BigDecimal unitPrice,
        @Size(max = 500) String notes) {
}
