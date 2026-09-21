package com.ramichanstore.backend.modules.loyalty.repository;

import com.ramichanstore.backend.modules.loyalty.entity.LoyaltyPointMovement;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LoyaltyPointMovementRepository
        extends JpaRepository<LoyaltyPointMovement, Long>, JpaSpecificationExecutor<LoyaltyPointMovement> {

    @Query("SELECT COALESCE(SUM(m.points), 0) FROM LoyaltyPointMovement m WHERE m.customer.id = :customerId")
    int sumBalance(@Param("customerId") Long customerId);

    @Query("SELECT COALESCE(SUM(m.points), 0) FROM LoyaltyPointMovement m WHERE m.points > 0 AND m.createdAt BETWEEN :from AND :to")
    int sumPositivePointsBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
