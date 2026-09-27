package com.ramichanstore.backend.modules.complaints.dto;

import com.ramichanstore.backend.modules.complaints.entity.ComplaintStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** "Acciones adoptadas por el proveedor" — lo que la ley exige que el negocio registre como respuesta. */
public record RespondComplaintRequest(
        @NotNull(message = "El estado es obligatorio") ComplaintStatus status,
        @NotBlank(message = "La respuesta es obligatoria") String providerResponse) {
}
