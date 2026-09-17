package com.ramichanstore.backend.modules.suppliers.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupplierRequest(
        @NotBlank(message = "El nombre es obligatorio") @Size(max = 150) String name,
        @Size(max = 150) String company,
        @Size(max = 30) String phone,
        @Size(max = 30) String whatsapp,
        @Size(max = 150) String email,
        @Size(max = 80) String country,
        @Size(max = 255) String address,
        @Size(max = 500) String notes) {
}
