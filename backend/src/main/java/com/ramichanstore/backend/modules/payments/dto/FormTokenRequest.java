package com.ramichanstore.backend.modules.payments.dto;

import jakarta.validation.constraints.NotNull;

public record FormTokenRequest(@NotNull(message = "El pedido es obligatorio") Long orderRequestId) {
}
