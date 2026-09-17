package com.ramichanstore.backend.modules.suppliers.repository;

import com.ramichanstore.backend.modules.suppliers.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
}
