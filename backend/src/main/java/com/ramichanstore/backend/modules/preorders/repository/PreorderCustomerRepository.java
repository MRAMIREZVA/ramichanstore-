package com.ramichanstore.backend.modules.preorders.repository;

import com.ramichanstore.backend.modules.preorders.entity.PreorderCustomer;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PreorderCustomerRepository extends JpaRepository<PreorderCustomer, Long>, JpaSpecificationExecutor<PreorderCustomer> {

    List<PreorderCustomer> findByPreorderIdOrderByCreatedAtDesc(Long preorderId);

    List<PreorderCustomer> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    boolean existsByCustomerId(Long customerId);

    @Query("SELECT COALESCE(SUM(pc.quantity), 0) FROM PreorderCustomer pc WHERE pc.preorder.id = :preorderId")
    int sumReservedQuantity(@Param("preorderId") Long preorderId);
}
