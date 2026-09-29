package com.ramichanstore.backend.modules.analytics.dto;

import com.ramichanstore.backend.modules.analytics.entity.CatalogEventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Submit público (sin login) desde el propio catálogo — ver CatalogTrackingService. */
public record CatalogTrackRequest(
        @NotNull(message = "El tipo de evento es obligatorio") CatalogEventType eventType,
        Long productId,
        @NotBlank(message = "El identificador de visitante es obligatorio") @Size(max = 64) String visitorId) {
}
