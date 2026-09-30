package com.ramichanstore.backend.modules.shipments.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.common.dto.PageResponse;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentItemRequest;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentItemResponse;
import com.ramichanstore.backend.modules.shipments.service.ShipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

/**
 * Artículos de embarque pre-registrados (Fase 40) — se pueden crear ANTES de
 * saber a qué embarque van; el formulario de embarque los busca por código en
 * vez de tipear todo de nuevo (ver ShipmentService.reconcileItems). El
 * endpoint de búsqueda (todavía en /pending por compatibilidad con el
 * frontend) devuelve solo el pool sin asignar por defecto, o TODOS los
 * artículos con {@code onlyPending=false} — ver ShipmentService.searchItems
 * (Fase 69).
 */
@RestController
@RequestMapping("/api/shipment-items")
@RequiredArgsConstructor
public class ShipmentItemController {

    private final ShipmentService shipmentService;

    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_VIEW')")
    public ApiResponse<PageResponse<ShipmentItemResponse>> search(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "true") boolean onlyPending,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(PageResponse.from(shipmentService.searchItems(search, onlyPending, pageable)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_MANAGE')")
    public ApiResponse<ShipmentItemResponse> create(@Valid @RequestBody ShipmentItemRequest request) {
        return ApiResponse.ok("Artículo registrado", shipmentService.createPendingItem(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_MANAGE')")
    public ApiResponse<ShipmentItemResponse> update(@PathVariable Long id, @Valid @RequestBody ShipmentItemRequest request) {
        return ApiResponse.ok("Artículo actualizado", shipmentService.updatePendingItem(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_MANAGE')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        shipmentService.deletePendingItem(id);
        return ApiResponse.ok("Artículo eliminado", null);
    }
}
