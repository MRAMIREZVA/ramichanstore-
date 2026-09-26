package com.ramichanstore.backend.modules.sales.dto;

import com.ramichanstore.backend.modules.sales.entity.DeliveryMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.sales.entity.SaleType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

/**
 * Deliberadamente NO incluye subtotal/total/totalCost/profit/pointsGenerated:
 * esos siempre los calcula SaleService a partir de los items.
 *
 * <p>{@code paymentMethod}/{@code deliveryMethod} son obligatorios solo si {@code type=VENTA}
 * (una separación nunca los tuvo a nivel de cabecera); {@code limitDate} es obligatoria solo si
 * {@code type=SEPARACION}. Esta obligatoriedad condicional se valida en {@code SaleService},
 * no acá con anotaciones — no existe una forma limpia de expresar "obligatorio según el valor
 * de otro campo" con Bean Validation simple.</p>
 */
public record SaleRequest(
        @NotNull(message = "El tipo de venta es obligatorio") SaleType type,
        Long customerId,
        @NotNull(message = "La fecha de venta es obligatoria") LocalDate saleDate,
        PaymentMethod paymentMethod,
        @NotNull(message = "El estado de pago es obligatorio") PaymentStatus paymentStatus,
        DeliveryMethod deliveryMethod,
        LocalDate limitDate,
        @NotEmpty(message = "La venta debe tener al menos un producto") @Valid List<SaleItemRequest> items,
        @Size(max = 500) String notes) {
}
