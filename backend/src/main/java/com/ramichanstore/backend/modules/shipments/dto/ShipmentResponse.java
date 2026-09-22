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
        BigDecimal domesticJapanShippingCost, BigDecimal additionalCost, BigDecimal handlingCost,
        BigDecimal exchangeRate, BigDecimal totalDollars, BigDecimal totalSoles, BigDecimal finalCost,
        ShipmentType shipmentType,
        LocalDate departureDate, LocalDate arrivalDate, Long transitDays,
        Integer travelDays, LocalDate possibleArrivalDate,
        BigDecimal figuresWeight, BigDecimal finalWeight, BigDecimal weightDifference,
        ShipmentStatus status, String notes,
        List<ShipmentItemResponse> items) {

    public static ShipmentResponse from(Shipment s) {
        BigDecimal totalDollars = totalDollars(s);
        BigDecimal totalSoles = totalSoles(totalDollars, s.getExchangeRate());
        return new ShipmentResponse(
                s.getId(), s.getCode(),
                s.getHolder().getId(), s.getHolder().getName(),
                s.getRecipient() != null ? s.getRecipient().getId() : null,
                s.getRecipient() != null ? s.getRecipient().getName() : null,
                s.getZenOrderNumber(),
                s.getProductCost(), s.getShippingCost(), s.getCommissionCost(),
                s.getDomesticJapanShippingCost(), s.getAdditionalCost(), s.getHandlingCost(),
                s.getExchangeRate(), totalDollars, totalSoles, finalCost(s, totalSoles),
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

    /**
     * Costo producto + envío + comisión + envío dentro de Japón — los 4 costos que
     * cobra el servicio proxy en Japón, siempre en US$. Costo adicional y gastos
     * movibles quedan fuera a propósito: son gastos locales en Perú, ya en S/, y
     * recién se suman en {@link #finalCost}, después de la conversión.
     */
    private static BigDecimal totalDollars(Shipment s) {
        if (s.getProductCost() == null && s.getShippingCost() == null
                && s.getCommissionCost() == null && s.getDomesticJapanShippingCost() == null) {
            return null;
        }
        return nz(s.getProductCost()).add(nz(s.getShippingCost()))
                .add(nz(s.getCommissionCost())).add(nz(s.getDomesticJapanShippingCost()));
    }

    private static BigDecimal totalSoles(BigDecimal totalDollars, BigDecimal exchangeRate) {
        if (totalDollars == null || exchangeRate == null) {
            return null;
        }
        return totalDollars.multiply(exchangeRate);
    }

    /** Costo final = Total (S/) + costo adicional + gastos movibles, todo ya en soles. */
    private static BigDecimal finalCost(Shipment s, BigDecimal totalSoles) {
        if (totalSoles == null) {
            return null;
        }
        return totalSoles.add(nz(s.getAdditionalCost())).add(nz(s.getHandlingCost()));
    }

    private static BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
