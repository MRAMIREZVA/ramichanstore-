package com.ramichanstore.backend.modules.shipments.dto;

import com.ramichanstore.backend.modules.shipments.entity.ShipmentStatus;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ShipmentRequest(
        @NotBlank(message = "El código es obligatorio") @Size(max = 50) String code,
        @NotNull(message = "El titular de la cuenta ZEN es obligatorio") Long holderId,
        @NotNull(message = "El titular del embarque es obligatorio") Long recipientId,
        @Size(max = 50) String zenOrderNumber,
        BigDecimal productCost, BigDecimal shippingCost, BigDecimal commissionCost,
        BigDecimal domesticJapanShippingCost, BigDecimal additionalCost, BigDecimal handlingCost,
        BigDecimal exchangeRate,
        @NotNull(message = "El tipo de envío es obligatorio") ShipmentType shipmentType,
        LocalDate departureDate, LocalDate arrivalDate, Integer travelDays, LocalDate possibleArrivalDate,
        BigDecimal figuresWeight, BigDecimal finalWeight,
        @NotNull(message = "El estado es obligatorio") ShipmentStatus status,
        @Size(max = 500) String notes,
        @NotEmpty(message = "El embarque debe tener al menos un artículo") @Valid List<ShipmentItemRequest> items) {
}
