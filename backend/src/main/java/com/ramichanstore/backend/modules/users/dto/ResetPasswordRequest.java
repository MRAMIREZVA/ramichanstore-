package com.ramichanstore.backend.modules.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(@NotBlank(message = "La nueva contraseña es obligatoria") @Size(min = 8, max = 100) String newPassword) {
}
