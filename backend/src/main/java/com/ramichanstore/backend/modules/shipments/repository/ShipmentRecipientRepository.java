package com.ramichanstore.backend.modules.shipments.repository;

import com.ramichanstore.backend.modules.shipments.entity.ShipmentRecipient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShipmentRecipientRepository extends JpaRepository<ShipmentRecipient, Long> {
}
