package com.ramichanstore.backend.modules.products.repository;

import com.ramichanstore.backend.modules.products.entity.ProductImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    List<ProductImage> findByProductIdOrderBySortOrderAsc(Long productId);
}
