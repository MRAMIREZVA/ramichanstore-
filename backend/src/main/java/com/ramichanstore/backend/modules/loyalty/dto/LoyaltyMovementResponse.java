package com.ramichanstore.backend.modules.loyalty.dto;

import com.ramichanstore.backend.modules.loyalty.entity.LoyaltyMovementType;
import com.ramichanstore.backend.modules.loyalty.entity.LoyaltyPointMovement;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;

public record LoyaltyMovementResponse(
        Long id, Long customerId, String customerName,
        LoyaltyMovementType movementType, int points, String reason,
        Long saleId, Long userId, String username, LocalDateTime createdAt) {

    /**
     * Mismo resguardo que PortalService/PreorderService/ReportService: un cliente
     * soft-eliminado detrás de un movimiento de puntos ya existente (el único
     * resguardo real es CustomerService.delete().existsByLoyaltyPointMovement, que
     * bloquea el borrado si hay movimientos — esto es la segunda capa, por si esa
     * guardia alguna vez se saltara) no debe tumbar la pantalla de Puntos completa.
     */
    public static LoyaltyMovementResponse from(LoyaltyPointMovement m) {
        Long customerId = m.getCustomer().getId();
        String customerName;
        try {
            customerName = m.getCustomer().getFullName();
        } catch (EntityNotFoundException ex) {
            customerName = "Cliente eliminado";
        }
        return new LoyaltyMovementResponse(
                m.getId(), customerId, customerName,
                m.getMovementType(), m.getPoints(), m.getReason(),
                m.getSale() != null ? m.getSale().getId() : null,
                m.getUserId(), m.getUsername(), m.getCreatedAt());
    }
}
