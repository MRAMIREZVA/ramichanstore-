package com.ramichanstore.backend.modules.portal.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.common.dto.PageResponse;
import com.ramichanstore.backend.modules.deliveries.dto.DeliveryResponse;
import com.ramichanstore.backend.modules.loyalty.dto.LoyaltyBalanceResponse;
import com.ramichanstore.backend.modules.portal.dto.PortalReservationResponse;
import com.ramichanstore.backend.modules.portal.service.PortalService;
import com.ramichanstore.backend.modules.sales.dto.SaleResponse;
import com.ramichanstore.backend.modules.separations.dto.SeparationResponse;
import com.ramichanstore.backend.security.CustomerPrincipal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Todo bajo /api/portal (salvo /api/portal/auth/**) exige ROLE_CUSTOMER — un
 * token de staff jamás tiene esa autoridad, así que nunca puede entrar aquí.
 * Cada método recibe el customerId del propio {@code @AuthenticationPrincipal},
 * nunca de un parámetro de la request: un cliente no puede pedir los datos de otro.
 */
@RestController
@RequestMapping("/api/portal")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class PortalController {

    private final PortalService portalService;

    @GetMapping("/sales")
    public ApiResponse<PageResponse<SaleResponse>> mySales(
            @AuthenticationPrincipal CustomerPrincipal principal,
            @PageableDefault(size = 20, sort = "saleDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(PageResponse.from(portalService.mySales(principal.getId(), pageable)));
    }

    @GetMapping("/sales/{id}")
    public ApiResponse<SaleResponse> mySale(@AuthenticationPrincipal CustomerPrincipal principal, @PathVariable Long id) {
        return ApiResponse.ok(portalService.mySale(principal.getId(), id));
    }

    @GetMapping("/separations")
    public ApiResponse<PageResponse<SeparationResponse>> mySeparations(
            @AuthenticationPrincipal CustomerPrincipal principal,
            @PageableDefault(size = 20, sort = "separationDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(PageResponse.from(portalService.mySeparations(principal.getId(), pageable)));
    }

    @GetMapping("/reservations")
    public ApiResponse<List<PortalReservationResponse>> myReservations(@AuthenticationPrincipal CustomerPrincipal principal) {
        return ApiResponse.ok(portalService.myReservations(principal.getId()));
    }

    @GetMapping("/loyalty/balance")
    public ApiResponse<LoyaltyBalanceResponse> myLoyaltyBalance(@AuthenticationPrincipal CustomerPrincipal principal) {
        return ApiResponse.ok(portalService.myLoyaltyBalance(principal.getId()));
    }

    @GetMapping("/deliveries")
    public ApiResponse<List<DeliveryResponse>> myDeliveries(@AuthenticationPrincipal CustomerPrincipal principal) {
        return ApiResponse.ok(portalService.myDeliveries(principal.getId()));
    }
}
