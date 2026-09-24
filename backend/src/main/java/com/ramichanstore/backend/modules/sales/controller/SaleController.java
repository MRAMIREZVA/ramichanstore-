package com.ramichanstore.backend.modules.sales.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.common.dto.PageResponse;
import com.ramichanstore.backend.modules.sales.dto.CancelSaleRequest;
import com.ramichanstore.backend.modules.sales.dto.SaleRequest;
import com.ramichanstore.backend.modules.sales.dto.SaleResponse;
import com.ramichanstore.backend.modules.sales.dto.UpdateSaleItemsRequest;
import com.ramichanstore.backend.modules.sales.dto.UpdateSalePaymentStatusRequest;
import com.ramichanstore.backend.modules.sales.entity.PaymentMethod;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.sales.service.SaleService;
import com.ramichanstore.backend.security.SecurityUser;
import jakarta.validation.Valid;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_SALE_VIEW')")
    public ApiResponse<PageResponse<SaleResponse>> search(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) PaymentMethod method,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 20, sort = "saleDate") Pageable pageable) {
        return ApiResponse.ok(PageResponse.from(saleService.search(customerId, status, method, from, to, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SALE_VIEW')")
    public ApiResponse<SaleResponse> findById(@PathVariable Long id) {
        return ApiResponse.ok(saleService.findResponseById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_SALE_CREATE')")
    public ApiResponse<SaleResponse> create(@Valid @RequestBody SaleRequest request, @AuthenticationPrincipal SecurityUser currentUser) {
        return ApiResponse.ok("Venta registrada", saleService.create(request, currentUser));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('PERM_SALE_CANCEL')")
    public ApiResponse<SaleResponse> cancel(
            @PathVariable Long id, @Valid @RequestBody CancelSaleRequest request, @AuthenticationPrincipal SecurityUser currentUser) {
        return ApiResponse.ok("Venta cancelada", saleService.cancel(id, request.reason(), currentUser));
    }

    @PutMapping("/{id}/payment-status")
    @PreAuthorize("hasAuthority('PERM_SALE_CREATE')")
    public ApiResponse<SaleResponse> updatePaymentStatus(@PathVariable Long id, @Valid @RequestBody UpdateSalePaymentStatusRequest request) {
        return ApiResponse.ok("Estado de pago actualizado", saleService.updatePaymentStatus(id, request.status()));
    }

    @PutMapping("/{id}/items")
    @PreAuthorize("hasAuthority('PERM_SALE_CREATE')")
    public ApiResponse<SaleResponse> updateItems(
            @PathVariable Long id, @Valid @RequestBody UpdateSaleItemsRequest request, @AuthenticationPrincipal SecurityUser currentUser) {
        return ApiResponse.ok("Venta actualizada", saleService.updateItems(id, request.items(), currentUser));
    }
}
