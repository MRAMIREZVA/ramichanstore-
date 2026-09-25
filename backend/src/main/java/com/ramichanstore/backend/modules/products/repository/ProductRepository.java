package com.ramichanstore.backend.modules.products.repository;

import com.ramichanstore.backend.modules.products.entity.Product;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    boolean existsBySkuIgnoreCase(String sku);

    boolean existsByLineId(Long lineId);

    boolean existsByCategoryId(Long categoryId);

    boolean existsByBrandId(Long brandId);

    boolean existsBySupplierId(Long supplierId);

    @Query("SELECT p FROM Product p WHERE p.currentStock <= p.minStock ORDER BY p.name")
    List<Product> findLowStock();

    /** Para el filtro "Franquicia" del catálogo público. */
    @Query("SELECT DISTINCT p.franchise FROM Product p WHERE p.franchise IS NOT NULL ORDER BY p.franchise")
    List<String> findDistinctFranchises();
}
