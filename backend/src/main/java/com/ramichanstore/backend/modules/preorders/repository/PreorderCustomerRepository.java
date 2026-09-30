package com.ramichanstore.backend.modules.preorders.repository;

import com.ramichanstore.backend.modules.preorders.entity.PreorderCustomer;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PreorderCustomerRepository extends JpaRepository<PreorderCustomer, Long>, JpaSpecificationExecutor<PreorderCustomer> {

    List<PreorderCustomer> findByPreorderIdOrderByCreatedAtDesc(Long preorderId);

    List<PreorderCustomer> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    boolean existsByCustomerId(Long customerId);

    @Query("SELECT COALESCE(SUM(pc.quantity), 0) FROM PreorderCustomer pc WHERE pc.preorder.id = :preorderId")
    int sumReservedQuantity(@Param("preorderId") Long preorderId);

    /** Para Reportes (gráficas de preventa, separadas de Ventas) — ver ReportService.getCharts. */
    List<PreorderCustomer> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    /**
     * `created_at` es `updatable = false` en BaseEntity (auditoría automática) — un UPDATE
     * JPQL directo es la única forma de corregirlo, para backfill de reservas anteriores
     * al sistema (ver PreorderService.updateReservationDate). `clearAutomatically` limpia
     * el contexto de persistencia para que una lectura posterior en la misma transacción
     * no devuelva el valor viejo cacheado en memoria.
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE PreorderCustomer pc SET pc.createdAt = :createdAt WHERE pc.id = :id")
    void updateCreatedAt(@Param("id") Long id, @Param("createdAt") LocalDateTime createdAt);
}
