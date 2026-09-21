package com.ramichanstore.backend.modules.customers.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EnablePortalAccessRequest(
        @NotBlank(message = "El usuario es obligatorio") @Size(max = 50) String username,
        @NotBlank(message = "La contraseña es obligatoria") @Size(min = 8, max = 100) String password) {
}
