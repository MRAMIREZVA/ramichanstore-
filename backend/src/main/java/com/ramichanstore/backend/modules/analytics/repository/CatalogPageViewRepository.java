package com.ramichanstore.backend.modules.analytics.repository;

import com.ramichanstore.backend.modules.analytics.entity.CatalogEventType;
import com.ramichanstore.backend.modules.analytics.entity.CatalogPageView;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Sin ciclo de vida propio más allá de insertar (ver CatalogPageView) — el resto son agregaciones para Reportes. */
public interface CatalogPageViewRepository extends JpaRepository<CatalogPageView, Long> {

    long countByEventTypeAndCreatedAtBetween(CatalogEventType eventType, LocalDateTime from, LocalDateTime to);

    @Query("SELECT COUNT(DISTINCT v.visitorId) FROM CatalogPageView v "
            + "WHERE v.eventType = :eventType AND v.createdAt BETWEEN :from AND :to")
    long countDistinctVisitorsBetween(
            @Param("eventType") CatalogEventType eventType, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT v.product.id, v.product.name, COUNT(v) FROM CatalogPageView v "
            + "WHERE v.eventType = 'PRODUCT_VIEW' AND v.product IS NOT NULL AND v.createdAt BETWEEN :from AND :to "
            + "GROUP BY v.product.id, v.product.name ORDER BY COUNT(v) DESC")
    List<Object[]> topViewedProductsBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);
}
