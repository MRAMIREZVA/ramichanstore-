package com.ramichanstore.backend.modules.categories.repository;

import com.ramichanstore.backend.modules.categories.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
}
