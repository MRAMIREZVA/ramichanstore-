package com.ramichanstore.backend.modules.preorders.repository;

import com.ramichanstore.backend.modules.preorders.entity.PreorderCustomerPayment;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PreorderCustomerPaymentRepository extends JpaRepository<PreorderCustomerPayment, Long> {

    List<PreorderCustomerPayment> findByPreorderCustomerIdOrderByCreatedAtDesc(Long preorderCustomerId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PreorderCustomerPayment p WHERE p.preorderCustomer.id = :reservationId")
    BigDecimal sumPaidAmount(@Param("reservationId") Long reservationId);
}
