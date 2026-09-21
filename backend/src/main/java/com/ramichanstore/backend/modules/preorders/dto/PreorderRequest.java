package com.ramichanstore.backend.modules.preorders.dto;

import com.ramichanstore.backend.modules.preorders.entity.PreorderStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PreorderRequest(
        @NotNull(message = "El producto es obligatorio") Long productId,
        @NotNull(message = "El monto mínimo de separación es obligatorio") @DecimalMin(value = "0", inclusive = true) BigDecimal minDepositAmount,
        @NotNull(message = "La fecha de inicio es obligatoria") LocalDate startDate,
        @NotNull(message = "La fecha límite es obligatoria") LocalDate limitDate,
        LocalDate estimatedArrivalDate,
        @NotNull(message = "La cantidad disponible es obligatoria") @Min(1) Integer availableQuantity,
        @NotNull PreorderStatus status,
        @Size(max = 500) String notes) {
}
