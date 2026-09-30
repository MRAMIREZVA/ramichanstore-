package com.ramichanstore.backend.modules.sales.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/** Corrige la fecha en la que se realizó la compra (ver SaleService.updateSaleDate). */
public record UpdateSaleDateRequest(@NotNull(message = "La fecha es obligatoria") LocalDate saleDate) {
}
