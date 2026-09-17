package com.ramichanstore.backend.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "El usuario o correo es obligatorio") String usernameOrEmail,
        @NotBlank(message = "La contraseña es obligatoria") String password) {
}
