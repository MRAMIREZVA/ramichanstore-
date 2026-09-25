package com.ramichanstore.backend.modules.preorders.repository;

import com.ramichanstore.backend.modules.preorders.entity.Preorder;
import com.ramichanstore.backend.modules.preorders.entity.PreorderStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PreorderRepository extends JpaRepository<Preorder, Long>, JpaSpecificationExecutor<Preorder> {

    long countByStatus(PreorderStatus status);

    boolean existsByProductId(Long productId);

    /** Campaña vigente de un producto en preventa (solo status ACTIVE acepta reservas nuevas) — ver OrderRequestService.submit. */
    Optional<Preorder> findFirstByProductIdAndStatusOrderByCreatedAtDesc(Long productId, PreorderStatus status);
}
