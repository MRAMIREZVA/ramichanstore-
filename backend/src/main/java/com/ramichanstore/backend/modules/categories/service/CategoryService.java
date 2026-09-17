package com.ramichanstore.backend.modules.categories.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.categories.dto.CategoryRequest;
import com.ramichanstore.backend.modules.categories.entity.Category;
import com.ramichanstore.backend.modules.categories.repository.CategoryRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private static final String MODULE = "PRODUCTS";

    private final CategoryRepository categoryRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Category findById(Long id) {
        return categoryRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Categoría", id));
    }

    @Transactional
    public Category create(CategoryRequest request) {
        Category category = new Category();
        category.setName(request.name());
        category.setDescription(request.description());
        Category saved = categoryRepository.save(category);
        auditService.log(AuditAction.CREATE, MODULE, "Category", saved.getId().toString(), null, saved.getName());
        return saved;
    }

    @Transactional
    public Category update(Long id, CategoryRequest request) {
        Category category = findById(id);
        String oldName = category.getName();
        category.setName(request.name());
        category.setDescription(request.description());
        Category saved = categoryRepository.save(category);
        auditService.log(AuditAction.UPDATE, MODULE, "Category", id.toString(), oldName, saved.getName());
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        Category category = findById(id);
        category.softDelete();
        categoryRepository.save(category);
        auditService.log(AuditAction.DELETE, MODULE, "Category", id.toString(), category.getName(), null);
    }
}
