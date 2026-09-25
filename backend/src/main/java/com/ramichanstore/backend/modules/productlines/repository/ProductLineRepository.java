package com.ramichanstore.backend.modules.productlines.repository;

import com.ramichanstore.backend.modules.productlines.entity.ProductLine;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductLineRepository extends JpaRepository<ProductLine, Long> {

    boolean existsByBrandId(Long brandId);
}
