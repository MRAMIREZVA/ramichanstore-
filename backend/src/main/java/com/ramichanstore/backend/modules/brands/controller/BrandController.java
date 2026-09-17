package com.ramichanstore.backend.modules.brands.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.brands.dto.BrandRequest;
import com.ramichanstore.backend.modules.brands.dto.BrandResponse;
import com.ramichanstore.backend.modules.brands.service.BrandService;
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
@RequestMapping("/api/brands")
@RequiredArgsConstructor
public class BrandController {

    private final BrandService brandService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_PRODUCT_VIEW')")
    public ApiResponse<List<BrandResponse>> findAll() {
        return ApiResponse.ok(brandService.findAll().stream().map(BrandResponse::from).toList());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<BrandResponse> create(@Valid @RequestBody BrandRequest request) {
        return ApiResponse.ok("Marca creada", BrandResponse.from(brandService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<BrandResponse> update(@PathVariable Long id, @Valid @RequestBody BrandRequest request) {
        return ApiResponse.ok("Marca actualizada", BrandResponse.from(brandService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        brandService.delete(id);
        return ApiResponse.ok("Marca eliminada", null);
    }
}
