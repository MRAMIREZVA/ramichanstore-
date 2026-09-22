package com.ramichanstore.backend.modules.shipments.dto;

import com.ramichanstore.backend.modules.shipments.entity.Shipment;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentStatus;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

public record ShipmentResponse(
        Long id, String code,
        Long holderId, String holderName,
        Long recipientId, String recipientName,
        String zenOrderNumber,
        BigDecimal productCost, BigDecimal shippingCost, BigDecimal commissionCost,
        BigDecimal domesticJapanShippingCost, BigDecimal additionalCost,
        BigDecimal totalSoles, BigDecimal totalDollars, BigDecimal handlingCost, BigDecimal finalCost,
        ShipmentType shipmentType,
        LocalDate departureDate, LocalDate arrivalDate, Long transitDays,
        Integer travelDays, LocalDate possibleArrivalDate,
        BigDecimal figuresWeight, BigDecimal finalWeight, BigDecimal weightDifference,
        ShipmentStatus status, String notes,
        List<ShipmentItemResponse> items) {

    public static ShipmentResponse from(Shipment s) {
        return new ShipmentResponse(
                s.getId(), s.getCode(),
                s.getHolder().getId(), s.getHolder().getName(),
                s.getRecipient() != null ? s.getRecipient().getId() : null,
                s.getRecipient() != null ? s.getRecipient().getName() : null,
                s.getZenOrderNumber(),
                s.getProductCost(), s.getShippingCost(), s.getCommissionCost(),
                s.getDomesticJapanShippingCost(), s.getAdditionalCost(),
                s.getTotalSoles(), s.getTotalDollars(), s.getHandlingCost(), s.getFinalCost(),
                s.getShipmentType(),
                s.getDepartureDate(), s.getArrivalDate(), transitDays(s),
                s.getTravelDays(), s.getPossibleArrivalDate(),
                s.getFiguresWeight(), s.getFinalWeight(), weightDifference(s),
                s.getStatus(), s.getNotes(),
                s.getItems().stream().map(ShipmentItemResponse::from).toList());
    }

    /** Días transcurridos desde que salió hasta que llegó (o hasta hoy si aún no llega) — nunca guardado, siempre calculado. */
    private static Long transitDays(Shipment s) {
        if (s.getDepartureDate() == null) {
            return null;
        }
        LocalDate reference = s.getArrivalDate() != null ? s.getArrivalDate() : LocalDate.now();
        return ChronoUnit.DAYS.between(s.getDepartureDate(), reference);
    }

    private static BigDecimal weightDifference(Shipment s) {
        if (s.getFiguresWeight() == null || s.getFinalWeight() == null) {
            return null;
        }
        return s.getFinalWeight().subtract(s.getFiguresWeight());
    }
}
