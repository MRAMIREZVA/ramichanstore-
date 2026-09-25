package com.ramichanstore.backend.modules.sales.repository;

import com.ramichanstore.backend.modules.sales.entity.SaleDetail;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Sin ciclo de vida propio (ver SaleDetail): este repositorio existe
 * únicamente para las agregaciones de Reportes (top productos/categorías),
 * no para operaciones CRUD sobre líneas de venta.
 */
public interface SaleDetailRepository extends JpaRepository<SaleDetail, Long> {

    boolean existsByProductId(Long productId);

    @Query("SELECT d.product.id, d.product.name, COALESCE(SUM(d.quantity), 0), COALESCE(SUM(d.subtotal), 0) "
            + "FROM SaleDetail d WHERE d.sale.saleDate BETWEEN :from AND :to AND d.sale.paymentStatus <> 'CANCELLED' "
            + "GROUP BY d.product.id, d.product.name ORDER BY SUM(d.subtotal) DESC")
    List<Object[]> topProductsBetween(@Param("from") LocalDate from, @Param("to") LocalDate to, Pageable pageable);

    @Query("SELECT d.product.category.id, d.product.category.name, COALESCE(SUM(d.subtotal), 0) "
            + "FROM SaleDetail d WHERE d.sale.saleDate BETWEEN :from AND :to AND d.sale.paymentStatus <> 'CANCELLED' "
            + "GROUP BY d.product.category.id, d.product.category.name ORDER BY SUM(d.subtotal) DESC")
    List<Object[]> topCategoriesBetween(@Param("from") LocalDate from, @Param("to") LocalDate to, Pageable pageable);
}
