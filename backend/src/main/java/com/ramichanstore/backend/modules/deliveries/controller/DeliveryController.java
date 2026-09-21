package com.ramichanstore.backend.modules.deliveries.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.common.dto.PageResponse;
import com.ramichanstore.backend.modules.deliveries.dto.DeliveryRequest;
import com.ramichanstore.backend.modules.deliveries.dto.DeliveryResponse;
import com.ramichanstore.backend.modules.deliveries.dto.PendingPurchaseResponse;
import com.ramichanstore.backend.modules.deliveries.entity.DeliveryStatus;
import com.ramichanstore.backend.modules.deliveries.service.DeliveryService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_DELIVERY_VIEW')")
    public ApiResponse<PageResponse<DeliveryResponse>> search(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) DeliveryStatus status,
            @PageableDefault(size = 20, sort = "scheduledDate") Pageable pageable) {
        return ApiResponse.ok(PageResponse.from(deliveryService.search(customerId, status, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_DELIVERY_VIEW')")
    public ApiResponse<DeliveryResponse> findById(@PathVariable Long id) {
        return ApiResponse.ok(deliveryService.findResponseById(id));
    }

    @GetMapping("/pending-purchases")
    @PreAuthorize("hasAuthority('PERM_DELIVERY_VIEW')")
    public ApiResponse<List<PendingPurchaseResponse>> pendingPurchases(
            @RequestParam Long customerId,
            @RequestParam(required = false) Long excludeDeliveryId) {
        return ApiResponse.ok(deliveryService.findPendingPurchases(customerId, excludeDeliveryId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_DELIVERY_CREATE')")
    public ApiResponse<DeliveryResponse> create(@Valid @RequestBody DeliveryRequest request) {
        return ApiResponse.ok("Entrega creada", deliveryService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_DELIVERY_EDIT')")
    public ApiResponse<DeliveryResponse> update(@PathVariable Long id, @Valid @RequestBody DeliveryRequest request) {
        return ApiResponse.ok("Entrega actualizada", deliveryService.update(id, request));
    }
}
