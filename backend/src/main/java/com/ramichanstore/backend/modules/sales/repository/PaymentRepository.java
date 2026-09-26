package com.ramichanstore.backend.modules.sales.repository;

import com.ramichanstore.backend.modules.sales.entity.Payment;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findBySaleIdOrderByCreatedAtDesc(Long saleId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.sale.id = :saleId")
    BigDecimal sumPaidAmount(@Param("saleId") Long saleId);
}
