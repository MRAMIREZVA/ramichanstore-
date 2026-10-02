package com.ramichanstore.backend.modules.shipments.repository;

import com.ramichanstore.backend.modules.shipments.entity.Shipment;
import com.ramichanstore.backend.modules.shipments.entity.ShipmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ShipmentRepository extends JpaRepository<Shipment, Long>, JpaSpecificationExecutor<Shipment> {

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByHolderId(Long holderId);

    boolean existsByRecipientId(Long recipientId);

    boolean existsByShipmentTypeId(Long shipmentTypeId);

    /**
     * Alerta del Dashboard (Fase 82): embarques observados por aduanas — el único estado de
     * ShipmentStatus que ya significa "problema" sin importar cuánto tiempo lleve ahí (a
     * diferencia de los demás, que son simplemente "todavía en camino"). Un umbral por tiempo
     * transcurrido no es confiable acá: Shipment no tiene una columna de "cambió de estado en
     * tal fecha", solo `updatedAt` (BaseEntity), que cualquier edición ajena (notas, pesos,
     * costos) también adelanta — ver investigación de Fase 82.
     */
    long countByStatus(ShipmentStatus status);
}
