package com.ramichanstore.backend.modules.orderrequests.dto;

import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequest;
import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequestStatus;

/**
 * Versión pública y mínima de {@link OrderRequestResponse} — sin datos del cliente (nombre,
 * teléfono, dirección). El checkout la usa para saber si su pago con Yape ya se confirmó
 * (el frontend hace polling acá mientras espera la IPN, ver Fase 37), sin exponer nada personal
 * a quien adivine un id.
 */
public record OrderRequestStatusResponse(Long id, OrderRequestStatus status, Long convertedSaleId) {
    public static OrderRequestStatusResponse from(OrderRequest o) {
        return new OrderRequestStatusResponse(o.getId(), o.getStatus(), o.getConvertedSaleId());
    }
}
