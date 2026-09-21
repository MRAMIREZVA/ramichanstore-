package com.ramichanstore.backend.modules.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
        @NotBlank(message = "El usuario es obligatorio") @Size(max = 50) String username,
        @NotBlank(message = "El correo es obligatorio") @Email @Size(max = 150) String email,
        @NotBlank(message = "El nombre completo es obligatorio") @Size(max = 150) String fullName,
        @NotNull(message = "El rol es obligatorio") Long roleId,
        boolean active) {
}
