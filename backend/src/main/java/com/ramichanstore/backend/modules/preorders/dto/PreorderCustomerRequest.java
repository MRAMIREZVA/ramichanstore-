package com.ramichanstore.backend.modules.preorders.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record PreorderCustomerRequest(
        @NotNull(message = "El cliente es obligatorio") Long customerId,
        @NotNull(message = "La cantidad es obligatoria") @Min(1) Integer quantity,
        @NotNull(message = "El monto de separación es obligatorio") @DecimalMin(value = "0", inclusive = true) BigDecimal depositAmount,
        @Size(max = 500) String notes) {
}
