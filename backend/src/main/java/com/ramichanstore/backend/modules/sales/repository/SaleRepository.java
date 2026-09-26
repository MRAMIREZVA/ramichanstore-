package com.ramichanstore.backend.modules.sales.repository;

import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.sales.entity.Sale;
import com.ramichanstore.backend.modules.sales.entity.SaleType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SaleRepository extends JpaRepository<Sale, Long>, JpaSpecificationExecutor<Sale> {

    List<Sale> findByCustomerIdOrderBySaleDateDesc(Long customerId);

    /** Cubre ambos tipos: un cliente con una separación (aunque nunca haya tenido una venta directa) también bloquea su borrado. */
    boolean existsByCustomerId(Long customerId);

    /** Para el reporte de cuentas por cobrar — una venta sin cliente (no debería existir hoy) queda fuera. */
    List<Sale> findByPaymentStatusInAndCustomerIsNotNull(List<PaymentStatus> statuses);

    /** Separaciones (type=SEPARACION) con saldo pendiente — dashboard y cuentas por cobrar. */
    List<Sale> findByTypeAndPaymentStatusIn(SaleType type, List<PaymentStatus> statuses);

    /**
     * Los 4 métodos de abajo alimentan reportes de INGRESOS (dashboard, gráficos, exportación) —
     * se filtran a {@code type='VENTA'} a propósito: una separación no empieza a contar como
     * "venta" en ganancias/ingresos solo porque ahora comparten tabla (mismo comportamiento que
     * antes de la fusión, cuando Separation ni siquiera aparecía en estas consultas).
     */
    @Query("SELECT COALESCE(SUM(s.total), 0) FROM Sale s WHERE s.type = 'VENTA' AND s.saleDate BETWEEN :from AND :to AND s.paymentStatus <> 'CANCELLED'")
    BigDecimal sumTotalBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(s.profit), 0) FROM Sale s WHERE s.type = 'VENTA' AND s.saleDate BETWEEN :from AND :to AND s.paymentStatus <> 'CANCELLED'")
    BigDecimal sumProfitBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.type = 'VENTA' AND s.saleDate BETWEEN :from AND :to AND s.paymentStatus <> 'CANCELLED'")
    long countBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT s.saleDate, COALESCE(SUM(s.total), 0), COALESCE(SUM(s.profit), 0) FROM Sale s "
            + "WHERE s.type = 'VENTA' AND s.saleDate BETWEEN :from AND :to AND s.paymentStatus <> 'CANCELLED' "
            + "GROUP BY s.saleDate ORDER BY s.saleDate")
    List<Object[]> dailyTotalsBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
