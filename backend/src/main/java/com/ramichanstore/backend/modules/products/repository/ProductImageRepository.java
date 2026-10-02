package com.ramichanstore.backend.modules.products.repository;

import com.ramichanstore.backend.modules.products.dto.ProductImageSummary;
import com.ramichanstore.backend.modules.products.entity.ProductImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    List<ProductImage> findByProductIdOrderBySortOrderAsc(Long productId);

    /**
     * Fase 78: metadatos de imagen para VARIOS productos a la vez, sin `imageData` — ver
     * {@link ProductImageSummary} para el motivo. Usado por listados en bloque
     * (catálogo público, listado admin), nunca por flujos de un solo producto, que
     * siguen usando {@link #findByProductIdOrderBySortOrderAsc} / la colección normal.
     */
    @Query("SELECT i.id AS id, i.product.id AS productId, i.fileName AS fileName, i.main AS main, i.sortOrder AS sortOrder "
            + "FROM ProductImage i WHERE i.product.id IN :productIds ORDER BY i.sortOrder ASC")
    List<ProductImageSummary> findSummariesByProductIdIn(@Param("productIds") List<Long> productIds);
}
