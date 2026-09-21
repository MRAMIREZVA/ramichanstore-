package com.ramichanstore.backend.modules.inventory.dto;

import com.ramichanstore.backend.modules.inventory.entity.MovementType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Para todos los tipos salvo AJUSTE, quantity debe ser un entero positivo (la
 * dirección la decide el tipo). Para AJUSTE, quantity es el delta con signo
 * que se aplica directamente al stock (puede ser negativo). InventoryService
 * valida ambos casos: el DTO no puede expresar "positivo salvo para AJUSTE"
 * con anotaciones de Bean Validation.
 */
public record InventoryMovementRequest(
        @NotNull(message = "El producto es obligatorio") Long productId,
        @NotNull(message = "El tipo de movimiento es obligatorio") MovementType movementType,
        @NotNull(message = "La cantidad es obligatoria") Integer quantity,
        @NotBlank(message = "El motivo es obligatorio") @Size(max = 255) String reason,
        @Size(max = 1000) String observation) {
}
