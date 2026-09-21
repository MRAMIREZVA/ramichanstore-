package com.ramichanstore.backend.modules.catalog.repository;

import com.ramichanstore.backend.modules.catalog.entity.CatalogAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CatalogAnnouncementRepository extends JpaRepository<CatalogAnnouncement, Long> {
}
