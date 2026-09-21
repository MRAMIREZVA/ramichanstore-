package com.ramichanstore.backend.modules.catalog.repository;

import com.ramichanstore.backend.modules.catalog.entity.CatalogBanner;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CatalogBannerRepository extends JpaRepository<CatalogBanner, Long> {
}
