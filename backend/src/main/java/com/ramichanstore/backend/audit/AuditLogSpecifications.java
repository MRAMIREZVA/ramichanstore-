package com.ramichanstore.backend.audit;

import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/** Filtros dinámicos de la bitácora de auditoría: módulo, acción, usuario, rango de fechas. */
public final class AuditLogSpecifications {

    private AuditLogSpecifications() {
    }

    public static Specification<AuditLog> hasModule(String module) {
        if (!StringUtils.hasText(module)) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("module"), module);
    }

    public static Specification<AuditLog> hasAction(AuditAction action) {
        if (action == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("action"), action);
    }

    public static Specification<AuditLog> usernameContains(String username) {
        if (!StringUtils.hasText(username)) {
            return null;
        }
        return (root, query, cb) -> cb.like(cb.lower(root.get("username")), "%" + username.toLowerCase() + "%");
    }

    public static Specification<AuditLog> createdFrom(LocalDate from) {
        if (from == null) {
            return null;
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay());
    }

    public static Specification<AuditLog> createdTo(LocalDate to) {
        if (to == null) {
            return null;
        }
        LocalDateTime endOfDay = to.atTime(23, 59, 59);
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), endOfDay);
    }
}
