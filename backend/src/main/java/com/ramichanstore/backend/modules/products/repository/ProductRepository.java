package com.ramichanstore.backend.modules.products.repository;

import com.ramichanstore.backend.modules.products.entity.Product;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    /**
     * Fase 78: `Product.brand/category/line` son `@ManyToOne` LAZY — sin este `@EntityGraph`,
     * mapear cada fila a su DTO (`ProductResponse`/`PublicProductResponse`, que leen
     * `getBrand().getName()` etc.) disparaba 3 queries extra POR PRODUCTO (N+1). Con páginas de
     * ~20-24 pasaba desapercibido; con el catálogo agrupado por franquicia (Fase 77, que pide
     * hasta 1000 de una vez) se volvía ~1680 queries extra y el endpoint tardaba 5+ segundos
     * incluso contra localhost. `images` queda AFUERA a propósito: un JOIN FETCH de una colección
     * `*ToMany` junto con paginación es un patrón riesgoso en Hibernate (puede terminar aplicando
     * el LIMIT/OFFSET en memoria en vez de en SQL, devolviendo páginas incorrectas) — se resuelve
     * aparte con `@BatchSize` en el propio campo (ver `Product.images`), seguro con paginación
     * porque no toca la query principal, solo agrupa las cargas perezosas posteriores.
     */
    @Override
    @EntityGraph(attributePaths = {"brand", "category", "line"})
    Page<Product> findAll(Specification<Product> spec, Pageable pageable);

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

    /** Valorización de inventario (Reportes → Inventario): stock actual valorizado a su costo real. */
    @Query("SELECT COALESCE(SUM(p.currentStock * p.totalCost), 0) FROM Product p")
    BigDecimal sumStockValueAtCost();

    /** Mismo stock, pero valorizado al precio de venta — para comparar contra el costo de arriba. */
    @Query("SELECT COALESCE(SUM(p.currentStock * p.salePrice), 0) FROM Product p")
    BigDecimal sumStockValueAtSalePrice();

    /** Cuántos productos activos tienen costo total en S/0 — la "ganancia" que muestran es ficticia. */
    long countByTotalCost(BigDecimal totalCost);
}
