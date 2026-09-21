package com.ramichanstore.backend.modules.preorders.repository;

import com.ramichanstore.backend.modules.preorders.entity.PreorderCustomer;
import com.ramichanstore.backend.modules.preorders.entity.PreorderStatus;
import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/** Filtros para la vista "Pedidos → Preventas" (reservas de TODAS las campañas juntas — ver sección 9, roadmap). */
public final class PreorderCustomerSpecifications {

    private PreorderCustomerSpecifications() {
    }

    public static Specification<PreorderCustomer> search(String term) {
        if (!StringUtils.hasText(term)) {
            return null;
        }
        String like = "%" + term.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("customer").get("fullName")), like),
                cb.like(cb.lower(root.get("preorder").get("product").get("name")), like),
                cb.like(cb.lower(root.get("preorder").get("product").get("sku")), like));
    }

    public static Specification<PreorderCustomer> hasStatus(PreorderStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("preorder").get("status"), status);
    }

    public static Specification<PreorderCustomer> createdFrom(LocalDate from) {
        if (from == null) {
            return null;
        }
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), from.atStartOfDay());
    }

    public static Specification<PreorderCustomer> createdTo(LocalDate to) {
        if (to == null) {
            return null;
        }
        return (root, query, cb) -> cb.lessThan(root.get("createdAt"), to.plusDays(1).atStartOfDay());
    }
}
