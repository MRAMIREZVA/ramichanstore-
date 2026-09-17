package com.ramichanstore.backend.modules.settings.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateSettingRequest(@NotBlank(message = "El valor es obligatorio") String value) {
}
