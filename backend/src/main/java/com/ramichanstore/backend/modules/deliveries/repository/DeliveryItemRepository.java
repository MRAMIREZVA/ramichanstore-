package com.ramichanstore.backend.modules.deliveries.repository;

import com.ramichanstore.backend.modules.deliveries.entity.DeliveryItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeliveryItemRepository extends JpaRepository<DeliveryItem, Long> {

    /** IDs de venta ya incluidos en alguna entrega, salvo (si se pasa) la que se está editando. */
    @Query("SELECT di.sale.id FROM DeliveryItem di WHERE di.sale IS NOT NULL "
            + "AND (:excludeDeliveryId IS NULL OR di.delivery.id <> :excludeDeliveryId)")
    List<Long> findBundledSaleIds(@Param("excludeDeliveryId") Long excludeDeliveryId);

    /** IDs de separación ya incluidos en alguna entrega, salvo (si se pasa) la que se está editando. */
    @Query("SELECT di.separation.id FROM DeliveryItem di WHERE di.separation IS NOT NULL "
            + "AND (:excludeDeliveryId IS NULL OR di.delivery.id <> :excludeDeliveryId)")
    List<Long> findBundledSeparationIds(@Param("excludeDeliveryId") Long excludeDeliveryId);
}
