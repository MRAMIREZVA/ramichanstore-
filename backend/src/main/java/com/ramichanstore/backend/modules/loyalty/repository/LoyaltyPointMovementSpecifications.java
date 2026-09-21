package com.ramichanstore.backend.modules.loyalty.repository;

import com.ramichanstore.backend.modules.loyalty.entity.LoyaltyMovementType;
import com.ramichanstore.backend.modules.loyalty.entity.LoyaltyPointMovement;
import org.springframework.data.jpa.domain.Specification;

/** Filtros dinámicos del historial de puntos: cliente + tipo de movimiento. */
public final class LoyaltyPointMovementSpecifications {

    private LoyaltyPointMovementSpecifications() {
    }

    public static Specification<LoyaltyPointMovement> hasCustomer(Long customerId) {
        if (customerId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("customer").get("id"), customerId);
    }

    public static Specification<LoyaltyPointMovement> hasType(LoyaltyMovementType type) {
        if (type == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("movementType"), type);
    }
}
