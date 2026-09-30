package com.ramichanstore.backend.modules.shipments.repository;

import com.ramichanstore.backend.modules.shipments.entity.ShipmentItem;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/**
 * Filtros de búsqueda de artículos de embarque (Fase 40/69) — se usa tanto para
 * el pool de pre-registrados como, desde Fase 69, para la búsqueda general de
 * "Artículos comprados" (pendientes Y ya asignados a un embarque, ver
 * ShipmentService.searchItems).
 */
public final class ShipmentItemSpecifications {

    private ShipmentItemSpecifications() {
    }

    /** Solo artículos sin asignar (shipment == null) — usado por el autocomplete de "buscar por código" al armar un embarque, que solo debe sugerir artículos disponibles para reclamar. */
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
