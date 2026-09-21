package com.ramichanstore.backend.modules.loyalty.dto;

import com.ramichanstore.backend.modules.loyalty.entity.LoyaltyMovementType;
import com.ramichanstore.backend.modules.loyalty.entity.LoyaltyPointMovement;
import java.time.LocalDateTime;

public record LoyaltyMovementResponse(
        Long id, Long customerId, String customerName,
        LoyaltyMovementType movementType, int points, String reason,
        Long saleId, Long userId, String username, LocalDateTime createdAt) {

    public static LoyaltyMovementResponse from(LoyaltyPointMovement m) {
        return new LoyaltyMovementResponse(
                m.getId(), m.getCustomer().getId(), m.getCustomer().getFullName(),
                m.getMovementType(), m.getPoints(), m.getReason(),
                m.getSale() != null ? m.getSale().getId() : null,
                m.getUserId(), m.getUsername(), m.getCreatedAt());
    }
}
