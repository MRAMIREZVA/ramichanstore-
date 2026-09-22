package com.ramichanstore.backend.modules.shipments.repository;

import com.ramichanstore.backend.modules.shipments.entity.ShipmentDocument;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentDocumentType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShipmentDocumentRepository extends JpaRepository<ShipmentDocument, Long> {

    Optional<ShipmentDocument> findByShipmentIdAndDocumentType(Long shipmentId, ShipmentDocumentType documentType);

    List<ShipmentDocument> findByShipmentId(Long shipmentId);
}
