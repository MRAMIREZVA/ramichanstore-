package com.ramichanstore.backend.modules.complaints.repository;

import com.ramichanstore.backend.modules.complaints.entity.Complaint;
import com.ramichanstore.backend.modules.complaints.entity.ComplaintStatus;
import com.ramichanstore.backend.modules.complaints.entity.ComplaintType;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.data.jpa.domain.Specification;

/** Filtros dinámicos del Libro de Reclamaciones: tipo, estado, rango de fechas — mismo patrón que AuditLogSpecifications. */
public final class ComplaintSpecifications {

    private ComplaintSpecifications() {
    }

    public static Specification<Complaint> hasType(ComplaintType type) {
        if (type == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("type"), type);
    }

    public static Specification<Complaint> hasStatus(ComplaintStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Complaint> createdFrom(LocalDate from) {
        if (from == null) {
            return null;
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay());
    }

    public static Specification<Complaint> createdTo(LocalDate to) {
        if (to == null) {
            return null;
        }
        LocalDateTime endOfDay = to.atTime(23, 59, 59);
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), endOfDay);
    }
}
