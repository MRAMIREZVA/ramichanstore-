package com.ramichanstore.backend.modules.separations.repository;

import com.ramichanstore.backend.modules.separations.entity.Payment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findBySeparationIdOrderByCreatedAtDesc(Long separationId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.separation.id = :separationId")
    java.math.BigDecimal sumPaidAmount(@Param("separationId") Long separationId);
}
