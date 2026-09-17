package com.ramichanstore.backend.modules.categories.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.categories.dto.CategoryRequest;
import com.ramichanstore.backend.modules.categories.dto.CategoryResponse;
import com.ramichanstore.backend.modules.categories.service.CategoryService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_PRODUCT_VIEW')")
    public ApiResponse<List<CategoryResponse>> findAll() {
        return ApiResponse.ok(categoryService.findAll().stream().map(CategoryResponse::from).toList());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<CategoryResponse> create(@Valid @RequestBody CategoryRequest request) {
        return ApiResponse.ok("Categoría creada", CategoryResponse.from(categoryService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<CategoryResponse> update(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return ApiResponse.ok("Categoría actualizada", CategoryResponse.from(categoryService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ApiResponse.ok("Categoría eliminada", null);
    }
}
