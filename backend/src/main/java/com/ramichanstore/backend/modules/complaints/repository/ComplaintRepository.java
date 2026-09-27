package com.ramichanstore.backend.modules.complaints.repository;

import com.ramichanstore.backend.modules.complaints.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ComplaintRepository extends JpaRepository<Complaint, Long>, JpaSpecificationExecutor<Complaint> {

    boolean existsByFolioNumberIgnoreCase(String folioNumber);
}
