package com.ramichanstore.backend.modules.preorders.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Proyección pública (catálogo, sin login) de la campaña de preventa activa de un
 * producto — deliberadamente sin costo ni ganancia estimada (eso sí es información de
 * negocio, no de catálogo, mismo criterio que PublicProductResponse). `minDepositAmount`
 * SÍ se expone a propósito (agregado después, pedido explícito del dueño): antes el
 * visitante no tenía forma de saber cuánto cuesta separar sin escribir por WhatsApp.
 */
public record PreorderPublicInfo(
        int availableSlots, int totalQuantity, LocalDate limitDate, LocalDate estimatedArrivalDate,
        BigDecimal minDepositAmount) {
}
