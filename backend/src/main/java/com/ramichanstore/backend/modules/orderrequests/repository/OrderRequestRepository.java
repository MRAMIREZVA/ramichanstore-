package com.ramichanstore.backend.modules.orderrequests.repository;

import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequest;
import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRequestRepository extends JpaRepository<OrderRequest, Long> {

    Page<OrderRequest> findByStatus(OrderRequestStatus status, Pageable pageable);

    boolean existsByDeliveryAgencyId(Long deliveryAgencyId);
}
