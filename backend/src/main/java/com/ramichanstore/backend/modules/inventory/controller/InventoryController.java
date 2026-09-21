package com.ramichanstore.backend.modules.inventory.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.common.dto.PageResponse;
import com.ramichanstore.backend.modules.inventory.dto.InventoryMovementRequest;
import com.ramichanstore.backend.modules.inventory.dto.InventoryMovementResponse;
import com.ramichanstore.backend.modules.inventory.entity.MovementType;
import com.ramichanstore.backend.modules.inventory.service.InventoryService;
import com.ramichanstore.backend.modules.products.dto.ProductResponse;
import com.ramichanstore.backend.security.SecurityUser;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/movements")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW')")
    public ApiResponse<PageResponse<InventoryMovementResponse>> search(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) MovementType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        var page = inventoryService.search(productId, type, from, to, pageable);
        return ApiResponse.ok(PageResponse.from(page));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_VIEW')")
    public ApiResponse<List<ProductResponse>> lowStock() {
        return ApiResponse.ok(inventoryService.lowStockProducts());
    }

    @PostMapping("/movements")
    @PreAuthorize("hasAuthority('PERM_INVENTORY_CREATE')")
    public ApiResponse<InventoryMovementResponse> registerMovement(
            @Valid @RequestBody InventoryMovementRequest request,
            @AuthenticationPrincipal SecurityUser currentUser) {
        return ApiResponse.ok("Movimiento registrado", inventoryService.registerMovement(request, currentUser));
    }
}
