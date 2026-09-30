package com.ramichanstore.backend.modules.reports.dto;

import java.time.LocalDate;

/** Calcado de {@link DailySalesPoint} pero para reservas de preventa — nunca se mezcla con Ventas. */
public record DailyReservationsPoint(LocalDate date, long reservationsCount) {
}
