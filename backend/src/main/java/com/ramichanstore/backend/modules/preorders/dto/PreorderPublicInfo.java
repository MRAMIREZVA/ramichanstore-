package com.ramichanstore.backend.modules.preorders.dto;

import java.time.LocalDate;

/**
 * Proyección pública (catálogo, sin login) de la campaña de preventa activa de un
 * producto — deliberadamente sin depósito mínimo, costo ni ganancia estimada (eso
 * es información de negocio, no de catálogo, mismo criterio que PublicProductResponse).
 * Solo lo que sirve para una barra de progreso/cuenta regresiva en el detalle público.
 */
public record PreorderPublicInfo(int availableSlots, int totalQuantity, LocalDate limitDate, LocalDate estimatedArrivalDate) {
}
