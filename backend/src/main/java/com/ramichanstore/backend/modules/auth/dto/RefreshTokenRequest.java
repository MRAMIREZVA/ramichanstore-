package com.ramichanstore.backend.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequest(@NotBlank(message = "El refresh token es obligatorio") String refreshToken) {
}
