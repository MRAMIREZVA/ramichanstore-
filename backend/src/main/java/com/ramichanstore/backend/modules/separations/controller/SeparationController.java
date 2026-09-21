package com.ramichanstore.backend.modules.separations.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.common.dto.PageResponse;
import com.ramichanstore.backend.modules.sales.entity.PaymentStatus;
import com.ramichanstore.backend.modules.separations.dto.CancelSeparationRequest;
import com.ramichanstore.backend.modules.separations.dto.PaymentRequest;
import com.ramichanstore.backend.modules.separations.dto.PaymentResponse;
import com.ramichanstore.backend.modules.separations.dto.SeparationRequest;
import com.ramichanstore.backend.modules.separations.dto.SeparationResponse;
import com.ramichanstore.backend.modules.separations.service.SeparationService;
import com.ramichanstore.backend.security.SecurityUser;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/separations")
@RequiredArgsConstructor
public class SeparationController {

    private final SeparationService separationService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_SEPARATION_VIEW')")
    public ApiResponse<PageResponse<SeparationResponse>> search(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 20, sort = "limitDate") Pageable pageable) {
        return ApiResponse.ok(PageResponse.from(separationService.search(customerId, status, from, to, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SEPARATION_VIEW')")
    public ApiResponse<SeparationResponse> findById(@PathVariable Long id) {
        return ApiResponse.ok(separationService.findResponseById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_SEPARATION_CREATE')")
    public ApiResponse<SeparationResponse> create(@Valid @RequestBody SeparationRequest request, @AuthenticationPrincipal SecurityUser currentUser) {
        return ApiResponse.ok("Separación creada", separationService.create(request, currentUser));
    }

    @GetMapping("/{id}/payments")
    @PreAuthorize("hasAuthority('PERM_SEPARATION_VIEW')")
    public ApiResponse<List<PaymentResponse>> listPayments(@PathVariable Long id) {
        return ApiResponse.ok(separationService.listPayments(id));
    }

    @PostMapping("/{id}/payments")
    @PreAuthorize("hasAuthority('PERM_SEPARATION_CREATE')")
    public ApiResponse<PaymentResponse> registerPayment(
            @PathVariable Long id, @Valid @RequestBody PaymentRequest request, @AuthenticationPrincipal SecurityUser currentUser) {
        return ApiResponse.ok("Abono registrado", separationService.registerPayment(id, request, currentUser));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('PERM_SEPARATION_CANCEL')")
    public ApiResponse<SeparationResponse> cancel(
            @PathVariable Long id, @Valid @RequestBody CancelSeparationRequest request, @AuthenticationPrincipal SecurityUser currentUser) {
        return ApiResponse.ok("Separación cancelada", separationService.cancel(id, request.reason(), currentUser));
    }
}
