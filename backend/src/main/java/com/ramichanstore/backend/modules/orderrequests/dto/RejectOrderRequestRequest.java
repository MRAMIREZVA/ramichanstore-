package com.ramichanstore.backend.modules.orderrequests.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectOrderRequestRequest(
        @NotBlank(message = "El motivo es obligatorio") @Size(max = 500) String reason) {
}
