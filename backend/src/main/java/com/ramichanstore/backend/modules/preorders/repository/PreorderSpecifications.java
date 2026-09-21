package com.ramichanstore.backend.modules.preorders.repository;

import com.ramichanstore.backend.modules.preorders.entity.Preorder;
import com.ramichanstore.backend.modules.preorders.entity.PreorderStatus;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/** Filtros dinámicos del listado de preventas: búsqueda por producto + estado. */
public final class PreorderSpecifications {

    private PreorderSpecifications() {
    }

    public static Specification<Preorder> search(String term) {
        if (!StringUtils.hasText(term)) {
            return null;
        }
        String like = "%" + term.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("product").get("name")), like),
                cb.like(cb.lower(root.get("product").get("sku")), like),
                cb.like(cb.lower(root.get("product").get("franchise")), like));
    }

    public static Specification<Preorder> hasStatus(PreorderStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }
}
