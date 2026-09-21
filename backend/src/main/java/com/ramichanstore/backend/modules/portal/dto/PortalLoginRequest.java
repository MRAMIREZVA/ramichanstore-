package com.ramichanstore.backend.modules.portal.dto;

import jakarta.validation.constraints.NotBlank;

public record PortalLoginRequest(
        @NotBlank(message = "El usuario es obligatorio") String username,
        @NotBlank(message = "La contraseña es obligatoria") String password) {
}
