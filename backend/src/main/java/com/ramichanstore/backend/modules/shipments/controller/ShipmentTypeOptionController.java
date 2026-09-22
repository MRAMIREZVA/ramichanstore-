package com.ramichanstore.backend.modules.shipments.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentTypeOptionRequest;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentTypeOptionResponse;
import com.ramichanstore.backend.modules.shipments.service.ShipmentTypeOptionService;
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
@RequestMapping("/api/shipment-type-options")
@RequiredArgsConstructor
public class ShipmentTypeOptionController {

    private final ShipmentTypeOptionService shipmentTypeOptionService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_VIEW')")
    public ApiResponse<List<ShipmentTypeOptionResponse>> findAll() {
        return ApiResponse.ok(shipmentTypeOptionService.findAll().stream().map(ShipmentTypeOptionResponse::from).toList());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_MANAGE')")
    public ApiResponse<ShipmentTypeOptionResponse> create(@Valid @RequestBody ShipmentTypeOptionRequest request) {
        return ApiResponse.ok("Tipo de envío creado", ShipmentTypeOptionResponse.from(shipmentTypeOptionService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_MANAGE')")
    public ApiResponse<ShipmentTypeOptionResponse> update(@PathVariable Long id, @Valid @RequestBody ShipmentTypeOptionRequest request) {
        return ApiResponse.ok("Tipo de envío actualizado", ShipmentTypeOptionResponse.from(shipmentTypeOptionService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_MANAGE')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        shipmentTypeOptionService.delete(id);
        return ApiResponse.ok("Tipo de envío eliminado", null);
    }
}
