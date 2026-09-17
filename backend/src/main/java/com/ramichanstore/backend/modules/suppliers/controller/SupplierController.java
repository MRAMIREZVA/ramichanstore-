package com.ramichanstore.backend.modules.suppliers.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.suppliers.dto.SupplierRequest;
import com.ramichanstore.backend.modules.suppliers.dto.SupplierResponse;
import com.ramichanstore.backend.modules.suppliers.service.SupplierService;
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
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_PRODUCT_VIEW')")
    public ApiResponse<List<SupplierResponse>> findAll() {
        return ApiResponse.ok(supplierService.findAll().stream().map(SupplierResponse::from).toList());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<SupplierResponse> create(@Valid @RequestBody SupplierRequest request) {
        return ApiResponse.ok("Proveedor creado", SupplierResponse.from(supplierService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<SupplierResponse> update(@PathVariable Long id, @Valid @RequestBody SupplierRequest request) {
        return ApiResponse.ok("Proveedor actualizado", SupplierResponse.from(supplierService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        supplierService.delete(id);
        return ApiResponse.ok("Proveedor eliminado", null);
    }
}
