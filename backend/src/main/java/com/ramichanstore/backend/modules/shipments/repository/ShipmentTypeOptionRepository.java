package com.ramichanstore.backend.modules.shipments.repository;

import com.ramichanstore.backend.modules.shipments.entity.ShipmentTypeOption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShipmentTypeOptionRepository extends JpaRepository<ShipmentTypeOption, Long> {
}
