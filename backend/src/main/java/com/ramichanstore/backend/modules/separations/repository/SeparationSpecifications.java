package com.ramichanstore.backend.modules.separations.repository;

import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.separations.entity.Separation;
import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;

/** Filtros dinámicos del listado de separaciones: cliente, estado, rango de fechas. */
public final class SeparationSpecifications {

    private SeparationSpecifications() {
    }

    public static Specification<Separation> hasCustomer(Long customerId) {
        if (customerId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("customer").get("id"), customerId);
    }

    public static Specification<Separation> hasStatus(PaymentStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Separation> separationDateFrom(LocalDate from) {
        if (from == null) {
            return null;
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("separationDate"), from);
    }

    public static Specification<Separation> separationDateTo(LocalDate to) {
        if (to == null) {
            return null;
        }
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("separationDate"), to);
    }
}
