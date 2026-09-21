package com.ramichanstore.backend.modules.sales.dto;

import com.ramichanstore.backend.modules.sales.entity.DeliveryMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

/**
 * Deliberadamente NO incluye subtotal/total/totalCost/profit/pointsGenerated:
 * esos siempre los calcula SaleService a partir de los items.
 */
public record SaleRequest(
        Long customerId,
        @NotNull(message = "La fecha de venta es obligatoria") LocalDate saleDate,
        @NotNull(message = "El método de pago es obligatorio") PaymentMethod paymentMethod,
        @NotNull(message = "El estado de pago es obligatorio") PaymentStatus paymentStatus,
        @NotNull(message = "El método de entrega es obligatorio") DeliveryMethod deliveryMethod,
        @NotEmpty(message = "La venta debe tener al menos un producto") @Valid List<SaleItemRequest> items,
        @Size(max = 500) String notes) {
}
