package com.ramichanstore.backend.modules.products.repository;

import com.ramichanstore.backend.modules.products.entity.Product;
import com.ramichanstore.backend.modules.products.entity.ProductStatus;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/** Filtros dinámicos del listado de productos: búsqueda + categoría/marca/estado. */
public final class ProductSpecifications {

    private ProductSpecifications() {
    }

    public static Specification<Product> search(String term) {
        if (!StringUtils.hasText(term)) {
            return null;
        }
        String like = "%" + term.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), like),
                cb.like(cb.lower(root.get("sku")), like),
                cb.like(cb.lower(root.get("characterName")), like),
                cb.like(cb.lower(root.get("franchise")), like));
    }

    public static Specification<Product> hasCategory(Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId);
    }

    public static Specification<Product> hasBrand(Long brandId) {
        if (brandId == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("brand").get("id"), brandId);
    }

    public static Specification<Product> hasStatus(ProductStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Product> excludeStatus(ProductStatus status) {
        if (status == null) {
            return null;
        }
        return (root, query, cb) -> cb.notEqual(root.get("status"), status);
    }

    public static Specification<Product> hasFranchise(String franchise) {
        if (!StringUtils.hasText(franchise)) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("franchise"), franchise);
    }
}
