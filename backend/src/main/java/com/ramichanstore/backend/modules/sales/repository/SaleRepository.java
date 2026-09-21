package com.ramichanstore.backend.modules.sales.repository;

import com.ramichanstore.backend.modules.sales.entity.Sale;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SaleRepository extends JpaRepository<Sale, Long>, JpaSpecificationExecutor<Sale> {

    List<Sale> findByCustomerIdOrderBySaleDateDesc(Long customerId);

    @Query("SELECT COALESCE(SUM(s.total), 0) FROM Sale s WHERE s.saleDate BETWEEN :from AND :to AND s.paymentStatus <> 'CANCELLED'")
    BigDecimal sumTotalBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(s.profit), 0) FROM Sale s WHERE s.saleDate BETWEEN :from AND :to AND s.paymentStatus <> 'CANCELLED'")
    BigDecimal sumProfitBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.saleDate BETWEEN :from AND :to AND s.paymentStatus <> 'CANCELLED'")
    long countBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT s.saleDate, COALESCE(SUM(s.total), 0), COALESCE(SUM(s.profit), 0) FROM Sale s "
            + "WHERE s.saleDate BETWEEN :from AND :to AND s.paymentStatus <> 'CANCELLED' "
            + "GROUP BY s.saleDate ORDER BY s.saleDate")
    List<Object[]> dailyTotalsBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
