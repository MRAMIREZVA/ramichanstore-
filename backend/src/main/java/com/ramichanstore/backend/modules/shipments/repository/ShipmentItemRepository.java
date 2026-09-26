package com.ramichanstore.backend.modules.shipments.repository;

import com.ramichanstore.backend.modules.shipments.entity.ShipmentItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ShipmentItemRepository extends JpaRepository<ShipmentItem, Long>, JpaSpecificationExecutor<ShipmentItem> {

    boolean existsByArticleCodeIgnoreCase(String articleCode);
}
