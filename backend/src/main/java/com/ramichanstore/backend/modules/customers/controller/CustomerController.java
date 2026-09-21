package com.ramichanstore.backend.modules.customers.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.common.dto.PageResponse;
import com.ramichanstore.backend.modules.customers.dto.CustomerRequest;
import com.ramichanstore.backend.modules.customers.dto.CustomerResponse;
import com.ramichanstore.backend.modules.customers.dto.EnablePortalAccessRequest;
import com.ramichanstore.backend.modules.customers.dto.ResetPortalPasswordRequest;
import com.ramichanstore.backend.modules.customers.entity.CustomerStatus;
import com.ramichanstore.backend.modules.customers.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_VIEW')")
    public ApiResponse<PageResponse<CustomerResponse>> search(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CustomerStatus status,
            @PageableDefault(size = 20, sort = "fullName") Pageable pageable) {
        var page = customerService.search(search, status, pageable);
        return ApiResponse.ok(PageResponse.from(page));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_VIEW')")
    public ApiResponse<CustomerResponse> findById(@PathVariable Long id) {
        return ApiResponse.ok(customerService.findResponseById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_CREATE')")
    public ApiResponse<CustomerResponse> create(@Valid @RequestBody CustomerRequest request) {
        return ApiResponse.ok("Cliente creado", customerService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_EDIT')")
    public ApiResponse<CustomerResponse> update(@PathVariable Long id, @Valid @RequestBody CustomerRequest request) {
        return ApiResponse.ok("Cliente actualizado", customerService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_DELETE')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        customerService.delete(id);
        return ApiResponse.ok("Cliente eliminado", null);
    }

    @PostMapping("/{id}/portal-access")
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_EDIT')")
    public ApiResponse<CustomerResponse> enablePortalAccess(@PathVariable Long id, @Valid @RequestBody EnablePortalAccessRequest request) {
        return ApiResponse.ok("Acceso al portal habilitado", customerService.enablePortalAccess(id, request));
    }

    @PostMapping("/{id}/portal-access/reset-password")
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_EDIT')")
    public ApiResponse<Void> resetPortalPassword(@PathVariable Long id, @Valid @RequestBody ResetPortalPasswordRequest request) {
        customerService.resetPortalPassword(id, request);
        return ApiResponse.ok("Contraseña de portal restablecida", null);
    }

    @DeleteMapping("/{id}/portal-access")
    @PreAuthorize("hasAuthority('PERM_CUSTOMER_EDIT')")
    public ApiResponse<CustomerResponse> disablePortalAccess(@PathVariable Long id) {
        return ApiResponse.ok("Acceso al portal deshabilitado", customerService.disablePortalAccess(id));
    }
}
