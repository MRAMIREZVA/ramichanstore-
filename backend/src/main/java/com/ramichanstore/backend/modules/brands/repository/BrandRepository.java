package com.ramichanstore.backend.modules.brands.repository;

import com.ramichanstore.backend.modules.brands.entity.Brand;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BrandRepository extends JpaRepository<Brand, Long> {
}
