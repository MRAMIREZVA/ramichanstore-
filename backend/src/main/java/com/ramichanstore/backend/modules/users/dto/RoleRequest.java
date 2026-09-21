package com.ramichanstore.backend.modules.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record RoleRequest(
        @NotBlank(message = "El nombre del rol es obligatorio") @Size(max = 50) String name,
        @Size(max = 255) String description,
        @NotNull(message = "Los permisos son obligatorios (puede ser una lista vacía)") Set<Long> permissionIds) {
}
