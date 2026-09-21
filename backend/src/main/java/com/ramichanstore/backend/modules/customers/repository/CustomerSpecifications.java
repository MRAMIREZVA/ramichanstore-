package com.ramichanstore.backend.modules.customers.repository;

import com.ramichanstore.backend.modules.customers.entity.Customer;
import com.ramichanstore.backend.modules.customers.entity.CustomerStatus;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/** Filtros dinámicos del listado de clientes: búsqueda + estado. */
public final class CustomerSpecifications {

    private CustomerSpecifications() {
    }

    public static Specification<Customer> search(String term) {
        if (!StringUtils.hasText(term)) {
            return null;
        }
        String like = "%" + term.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("fullName")), like),
                cb.like(cb.lower(root.get("documentNumber")), like),
                cb.like(cb.lower(root.get("phone")), like),
                cb.like(cb.lower(root.get("email")), like));
    }

    public static Specification<Customer> hasStatus(CustomerStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }
}
