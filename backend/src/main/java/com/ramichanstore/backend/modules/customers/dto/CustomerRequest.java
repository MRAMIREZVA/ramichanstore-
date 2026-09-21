package com.ramichanstore.backend.modules.customers.dto;

import com.ramichanstore.backend.modules.customers.entity.CustomerStatus;
import com.ramichanstore.backend.modules.customers.entity.DocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CustomerRequest(
        @NotBlank(message = "El nombre es obligatorio") @Size(max = 200) String fullName,
        DocumentType documentType,
        @Size(max = 20) String documentNumber,
        @NotBlank(message = "El teléfono es obligatorio") @Size(max = 30) String phone,
        @Size(max = 30) String whatsapp,
        @Size(max = 150) String email,
        @Size(max = 100) String district,
        @Size(max = 255) String address,
        @NotNull CustomerStatus status,
        @Size(max = 500) String notes) {
}
