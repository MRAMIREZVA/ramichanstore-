package com.ramichanstore.backend.modules.portal.dto;

import jakarta.validation.constraints.NotBlank;

public record PortalRefreshRequest(@NotBlank(message = "El refresh token es obligatorio") String refreshToken) {
}
