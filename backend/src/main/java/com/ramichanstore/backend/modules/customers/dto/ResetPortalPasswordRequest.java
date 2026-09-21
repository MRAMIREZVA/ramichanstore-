package com.ramichanstore.backend.modules.customers.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPortalPasswordRequest(
        @NotBlank(message = "La nueva contraseña es obligatoria") @Size(min = 8, max = 100) String newPassword) {
}
