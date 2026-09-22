package com.ramichanstore.backend.modules.shipments.repository;

import com.ramichanstore.backend.modules.shipments.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ShipmentRepository extends JpaRepository<Shipment, Long>, JpaSpecificationExecutor<Shipment> {

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByHolderId(Long holderId);

    boolean existsByRecipientId(Long recipientId);

    boolean existsByShipmentTypeId(Long shipmentTypeId);
}
