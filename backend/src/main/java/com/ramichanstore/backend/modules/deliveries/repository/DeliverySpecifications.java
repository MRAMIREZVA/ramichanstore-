package com.ramichanstore.backend.modules.deliveries.repository;

import com.ramichanstore.backend.modules.deliveries.entity.Delivery;
import com.ramichanstore.backend.modules.deliveries.entity.DeliveryStatus;
import org.springframework.data.jpa.domain.Specification;

/** Filtros dinámicos del listado de entregas: cliente + estado. */
public final class DeliverySpecifications {

    private DeliverySpecifications() {
    }

    public static Specification<Delivery> hasCustomer(Long customerId) {
        if (customerId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("customer").get("id"), customerId);
    }

    public static Specification<Delivery> hasStatus(DeliveryStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }
}
