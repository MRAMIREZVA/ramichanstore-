package com.ramichanstore.backend.modules.shipments.dto;

import com.ramichanstore.backend.modules.shipments.entity.Shipment;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentStatus;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentType;
import java.math.BigDecimal;
import java.math.RoundingMode;
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
        boolean wentThroughCustoms, BigDecimal customsTaxAmount,
        List<ShipmentItemResponse> items, List<ShipmentDocumentResponse> documents) {

    public static ShipmentResponse from(Shipment s) {
        BigDecimal totalSoles = totalSoles(s);
        BigDecimal totalDollars = totalDollars(totalSoles, s.getExchangeRate());
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
                s.isWentThroughCustoms(), s.getCustomsTaxAmount(),
                s.getItems().stream().map(ShipmentItemResponse::from).toList(),
                s.getDocuments().stream().map(d -> ShipmentDocumentResponse.from(s.getId(), d)).toList());
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
     * Costo producto + envío + comisión + envío dentro de Japón — los 4 costos base
     * del embarque, siempre en S/ (igual que costo adicional/gastos movibles). Total
     * (US$) es solo la conversión informativa de esta suma (ver {@link #totalDollars}),
     * nunca al revés — todo lo que se ingresa en este módulo ya está en soles.
     */
    private static BigDecimal totalSoles(Shipment s) {
        if (s.getProductCost() == null && s.getShippingCost() == null
                && s.getCommissionCost() == null && s.getDomesticJapanShippingCost() == null) {
            return null;
        }
        return nz(s.getProductCost()).add(nz(s.getShippingCost()))
                .add(nz(s.getCommissionCost())).add(nz(s.getDomesticJapanShippingCost()));
    }

    /** Equivalente informativo en US$ de Total (S/) — Total (S/) ÷ tipo de cambio. */
    private static BigDecimal totalDollars(BigDecimal totalSoles, BigDecimal exchangeRate) {
        if (totalSoles == null || exchangeRate == null || exchangeRate.signum() == 0) {
            return null;
        }
        return totalSoles.divide(exchangeRate, 2, RoundingMode.HALF_UP);
    }

    /** Costo final = Total (S/) + costo adicional + gastos movibles, todo en soles — sin conversión. */
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
