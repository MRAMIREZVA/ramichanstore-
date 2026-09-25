package com.ramichanstore.backend.modules.deliveries.dto;

import com.ramichanstore.backend.modules.deliveries.entity.DeliveryStatus;
import com.ramichanstore.backend.modules.sales.entity.DeliveryMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public record DeliveryRequest(
        @NotNull(message = "El cliente es obligatorio") Long customerId,
        List<Long> saleIds,
        List<Long> separationIds,
        @NotNull(message = "El tipo de entrega es obligatorio") DeliveryMethod deliveryType,
        @Size(max = 255) String address,
        @Size(max = 100) String district,
        @Size(max = 100) String department,
        @Size(max = 100) String province,
        Long deliveryAgencyId,
        @Size(max = 20) String recipientDni,
        @Size(max = 200) String recipientName,
        @Size(max = 30) String recipientPhone,
        @Size(max = 150) String courier,
        @NotNull(message = "La fecha programada es obligatoria") LocalDate scheduledDate,
        @NotNull DeliveryStatus status,
        @Size(max = 500) String notes) {
}
