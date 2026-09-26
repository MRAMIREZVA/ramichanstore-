package com.ramichanstore.backend.modules.shipments.repository;

import com.ramichanstore.backend.modules.shipments.entity.ShipmentItem;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/** Filtros del pool de artículos pendientes (aún no asignados a ningún embarque) — ver Fase 40. */
public final class ShipmentItemSpecifications {

    private ShipmentItemSpecifications() {
    }

    public static Specification<ShipmentItem> isPending() {
        return (root, query, cb) -> cb.isNull(root.get("shipment"));
    }

    public static Specification<ShipmentItem> search(String term) {
        if (!StringUtils.hasText(term)) {
            return null;
        }
        String like = "%" + term.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("articleCode")), like),
                cb.like(cb.lower(root.get("description")), like));
    }
}
