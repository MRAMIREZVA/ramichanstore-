package com.ramichanstore.backend.modules.stockalerts.repository;

import com.ramichanstore.backend.modules.stockalerts.entity.StockAlertRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockAlertRequestRepository extends JpaRepository<StockAlertRequest, Long> {

    List<StockAlertRequest> findByProductIdAndNotifiedFalseOrderByCreatedAtDesc(Long productId);

    boolean existsByProductId(Long productId);
}
