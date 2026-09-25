package com.ramichanstore.backend.modules.deliveryagencies.repository;

import com.ramichanstore.backend.modules.deliveryagencies.entity.DeliveryAgency;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliveryAgencyRepository extends JpaRepository<DeliveryAgency, Long> {

    List<DeliveryAgency> findAllByOrderByNameAsc();
}
