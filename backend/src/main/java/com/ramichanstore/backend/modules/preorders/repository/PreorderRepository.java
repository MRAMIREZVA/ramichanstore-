package com.ramichanstore.backend.modules.preorders.repository;

import com.ramichanstore.backend.modules.preorders.entity.Preorder;
import com.ramichanstore.backend.modules.preorders.entity.PreorderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PreorderRepository extends JpaRepository<Preorder, Long>, JpaSpecificationExecutor<Preorder> {

    long countByStatus(PreorderStatus status);

    boolean existsByProductId(Long productId);
}
