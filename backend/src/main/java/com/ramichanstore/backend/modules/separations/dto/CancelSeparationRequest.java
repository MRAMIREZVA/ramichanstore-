package com.ramichanstore.backend.modules.separations.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelSeparationRequest(@NotBlank(message = "El motivo de cancelación es obligatorio") @Size(max = 255) String reason) {
}
