package com.ramichanstore.backend.modules.inventory.dto;

import com.ramichanstore.backend.modules.inventory.entity.InventoryMovement;
import com.ramichanstore.backend.modules.inventory.entity.MovementType;
import java.time.LocalDateTime;

public record InventoryMovementResponse(
        Long id,
        Long productId, String productSku, String productName,
        MovementType movementType, int quantity, int previousStock, int newStock,
        String reason, String observation,
        Long userId, String username, LocalDateTime createdAt) {

    public static InventoryMovementResponse from(InventoryMovement m) {
        return new InventoryMovementResponse(
                m.getId(),
                m.getProduct().getId(), m.getProduct().getSku(), m.getProduct().getName(),
                m.getMovementType(), m.getQuantity(), m.getPreviousStock(), m.getNewStock(),
                m.getReason(), m.getObservation(),
                m.getUserId(), m.getUsername(), m.getCreatedAt());
    }
}
