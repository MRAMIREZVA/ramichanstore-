package com.ramichanstore.backend.modules.inventory.repository;

import com.ramichanstore.backend.modules.inventory.entity.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface InventoryMovementRepository
        extends JpaRepository<InventoryMovement, Long>, JpaSpecificationExecutor<InventoryMovement> {
}
