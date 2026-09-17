package com.ramichanstore.backend.modules.productlines.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.productlines.dto.ProductLineRequest;
import com.ramichanstore.backend.modules.productlines.dto.ProductLineResponse;
import com.ramichanstore.backend.modules.productlines.service.ProductLineService;
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
@RequestMapping("/api/product-lines")
@RequiredArgsConstructor
public class ProductLineController {

    private final ProductLineService productLineService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_PRODUCT_VIEW')")
    public ApiResponse<List<ProductLineResponse>> findAll() {
        return ApiResponse.ok(productLineService.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<ProductLineResponse> create(@Valid @RequestBody ProductLineRequest request) {
        return ApiResponse.ok("Línea creada", ProductLineResponse.from(productLineService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<ProductLineResponse> update(@PathVariable Long id, @Valid @RequestBody ProductLineRequest request) {
        return ApiResponse.ok("Línea actualizada", ProductLineResponse.from(productLineService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        productLineService.delete(id);
        return ApiResponse.ok("Línea eliminada", null);
    }
}
