package com.ramichanstore.backend.modules.separations.dto;

import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentRequest(
        @NotNull(message = "El monto es obligatorio") @DecimalMin(value = "0.01") BigDecimal amount,
        @NotNull(message = "El método de pago es obligatorio") PaymentMethod paymentMethod,
        @NotNull(message = "La fecha de pago es obligatoria") LocalDate paymentDate,
        @Size(max = 500) String notes) {
}
