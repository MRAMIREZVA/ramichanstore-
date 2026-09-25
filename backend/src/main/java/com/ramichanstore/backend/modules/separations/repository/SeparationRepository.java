package com.ramichanstore.backend.modules.separations.repository;

import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.separations.entity.Separation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface SeparationRepository extends JpaRepository<Separation, Long>, JpaSpecificationExecutor<Separation> {

    List<Separation> findByStatusIn(List<PaymentStatus> statuses);

    List<Separation> findByCustomerIdOrderBySeparationDateDesc(Long customerId);

    boolean existsByProductId(Long productId);

    boolean existsByCustomerId(Long customerId);
}
