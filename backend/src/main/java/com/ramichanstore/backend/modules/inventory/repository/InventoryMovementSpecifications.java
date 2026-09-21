package com.ramichanstore.backend.modules.inventory.repository;

import com.ramichanstore.backend.modules.inventory.entity.InventoryMovement;
import com.ramichanstore.backend.modules.inventory.entity.MovementType;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.data.jpa.domain.Specification;

/** Filtros dinámicos del historial de movimientos: producto/tipo/rango de fechas. */
public final class InventoryMovementSpecifications {

    private InventoryMovementSpecifications() {
    }

    public static Specification<InventoryMovement> hasProduct(Long productId) {
        if (productId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("product").get("id"), productId);
    }

    public static Specification<InventoryMovement> hasType(MovementType type) {
        if (type == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("movementType"), type);
    }

    public static Specification<InventoryMovement> createdFrom(LocalDate from) {
        if (from == null) {
            return null;
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay());
    }

    public static Specification<InventoryMovement> createdTo(LocalDate to) {
        if (to == null) {
            return null;
        }
        LocalDateTime endOfDay = to.atTime(23, 59, 59);
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), endOfDay);
    }
}
