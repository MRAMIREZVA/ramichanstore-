package com.ramichanstore.backend.modules.shipments.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentHolderRequest;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentHolderResponse;
import com.ramichanstore.backend.modules.shipments.service.ShipmentHolderService;
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
@RequestMapping("/api/shipment-holders")
@RequiredArgsConstructor
public class ShipmentHolderController {

    private final ShipmentHolderService shipmentHolderService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_VIEW')")
    public ApiResponse<List<ShipmentHolderResponse>> findAll() {
        return ApiResponse.ok(shipmentHolderService.findAll().stream().map(ShipmentHolderResponse::from).toList());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_MANAGE')")
    public ApiResponse<ShipmentHolderResponse> create(@Valid @RequestBody ShipmentHolderRequest request) {
        return ApiResponse.ok("Titular creado", ShipmentHolderResponse.from(shipmentHolderService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_MANAGE')")
    public ApiResponse<ShipmentHolderResponse> update(@PathVariable Long id, @Valid @RequestBody ShipmentHolderRequest request) {
        return ApiResponse.ok("Titular actualizado", ShipmentHolderResponse.from(shipmentHolderService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_MANAGE')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        shipmentHolderService.delete(id);
        return ApiResponse.ok("Titular eliminado", null);
    }
}
