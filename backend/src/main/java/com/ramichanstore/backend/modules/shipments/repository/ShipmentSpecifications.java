package com.ramichanstore.backend.modules.shipments.repository;

import com.ramichanstore.backend.modules.shipments.entity.Shipment;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentStatus;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentType;
import jakarta.persistence.criteria.JoinType;
import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/** Filtros dinámicos del listado de embarques: búsqueda por código/titular/orden ZEN, estado, tipo, rango de salida. */
public final class ShipmentSpecifications {

    private ShipmentSpecifications() {
    }

    public static Specification<Shipment> search(String term) {
        if (!StringUtils.hasText(term)) {
            return null;
        }
        String like = "%" + term.toLowerCase() + "%";
        // LEFT JOIN explícito: recipient puede ser null (embarques de antes de V20) y un
        // root.get(...) normal haría un INNER JOIN implícito, excluyendo esos embarques
        // de CUALQUIER búsqueda aunque el término coincida por código/titular ZEN.
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("code")), like),
                cb.like(cb.lower(root.get("holder").get("name")), like),
                cb.like(cb.lower(root.join("recipient", JoinType.LEFT).get("name")), like),
                cb.like(cb.lower(root.get("zenOrderNumber")), like));
    }

    public static Specification<Shipment> hasStatus(ShipmentStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Shipment> hasShipmentType(ShipmentType type) {
        if (type == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("shipmentType"), type);
    }

    public static Specification<Shipment> hasHolder(Long holderId) {
        if (holderId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("holder").get("id"), holderId);
    }

    public static Specification<Shipment> departureFrom(LocalDate from) {
        if (from == null) {
            return null;
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("departureDate"), from);
    }

    public static Specification<Shipment> departureTo(LocalDate to) {
        if (to == null) {
            return null;
        }
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("departureDate"), to);
    }
}
