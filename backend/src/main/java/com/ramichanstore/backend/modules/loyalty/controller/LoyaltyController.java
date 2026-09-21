package com.ramichanstore.backend.modules.loyalty.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.common.dto.PageResponse;
import com.ramichanstore.backend.modules.loyalty.dto.LoyaltyBalanceResponse;
import com.ramichanstore.backend.modules.loyalty.dto.LoyaltyMovementRequest;
import com.ramichanstore.backend.modules.loyalty.dto.LoyaltyMovementResponse;
import com.ramichanstore.backend.modules.loyalty.entity.LoyaltyMovementType;
import com.ramichanstore.backend.modules.loyalty.service.LoyaltyService;
import com.ramichanstore.backend.security.SecurityUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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
@RequestMapping("/api/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    @GetMapping("/movements")
    @PreAuthorize("hasAuthority('PERM_LOYALTY_VIEW')")
    public ApiResponse<PageResponse<LoyaltyMovementResponse>> search(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) LoyaltyMovementType type,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(PageResponse.from(loyaltyService.search(customerId, type, pageable)));
    }

    @GetMapping("/balance/{customerId}")
    @PreAuthorize("hasAuthority('PERM_LOYALTY_VIEW')")
    public ApiResponse<LoyaltyBalanceResponse> getBalance(@PathVariable Long customerId) {
        return ApiResponse.ok(loyaltyService.getBalance(customerId));
    }

    @PostMapping("/movements")
    @PreAuthorize("hasAuthority('PERM_LOYALTY_ADJUST')")
    public ApiResponse<LoyaltyMovementResponse> registerMovement(
            @Valid @RequestBody LoyaltyMovementRequest request, @AuthenticationPrincipal SecurityUser currentUser) {
        return ApiResponse.ok("Movimiento de puntos registrado", loyaltyService.registerMovement(request, currentUser));
    }
}
