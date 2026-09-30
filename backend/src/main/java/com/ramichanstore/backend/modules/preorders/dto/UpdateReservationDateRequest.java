package com.ramichanstore.backend.modules.preorders.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/** Corrige el día en que se hizo la reserva — ver PreorderService.updateReservationDate. */
public record UpdateReservationDateRequest(@NotNull(message = "La fecha es obligatoria") LocalDate reservedAt) {
}
