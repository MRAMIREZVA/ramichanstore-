package com.ramichanstore.backend.modules.shipments.repository;

import com.ramichanstore.backend.modules.shipments.entity.ShipmentHolder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShipmentHolderRepository extends JpaRepository<ShipmentHolder, Long> {
}
