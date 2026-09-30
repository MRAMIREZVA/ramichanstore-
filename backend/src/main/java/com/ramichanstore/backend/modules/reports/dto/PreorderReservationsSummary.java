package com.ramichanstore.backend.modules.reports.dto;

import java.math.BigDecimal;

/**
 * Reservas de preventa en el rango de fechas — deliberadamente separado de las cifras de
 * Ventas (nunca se suma a `dailySales`/totales de ingresos): una reserva de preventa no es
 * una venta, y un depósito no es lo mismo que cobrar el total de un producto.
 */
public record PreorderReservationsSummary(long totalReservations, BigDecimal totalDeposits) {
}
