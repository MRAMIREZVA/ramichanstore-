package com.ramichanstore.backend.modules.deliveries.repository;

import com.ramichanstore.backend.modules.deliveries.entity.Delivery;
import com.ramichanstore.backend.modules.deliveries.entity.DeliveryStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface DeliveryRepository extends JpaRepository<Delivery, Long>, JpaSpecificationExecutor<Delivery> {

    boolean existsByDeliveryAgencyId(Long deliveryAgencyId);

    boolean existsByCustomerId(Long customerId);

    /** Alertas del Dashboard (Fase 82): entregas que ya debieron salir/llegar pero siguen sin estado final. */
    long countByStatusInAndScheduledDateBefore(List<DeliveryStatus> statuses, LocalDate date);
}
