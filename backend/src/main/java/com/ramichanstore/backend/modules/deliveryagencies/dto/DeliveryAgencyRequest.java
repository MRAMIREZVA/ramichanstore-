package com.ramichanstore.backend.modules.deliveryagencies.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeliveryAgencyRequest(
        @NotBlank(message = "El nombre es obligatorio") @Size(max = 100) String name) {
}
