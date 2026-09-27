package com.ramichanstore.backend.modules.products.repository;

import com.ramichanstore.backend.modules.products.entity.Product;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    boolean existsBySkuIgnoreCase(String sku);

    /**
     * Búsqueda por código escaneado (cámara del celular): prueba primero contra el código de barras
     * de fábrica y, si no hay match, contra el SKU — así el mismo flujo de escaneo sirve tanto para
     * una caja con EAN de fábrica como para la etiqueta propia impresa desde el admin (que codifica el SKU).
     */
    Optional<Product> findFirstByBarcodeIgnoreCaseOrSkuIgnoreCase(String barcode, String sku);

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
