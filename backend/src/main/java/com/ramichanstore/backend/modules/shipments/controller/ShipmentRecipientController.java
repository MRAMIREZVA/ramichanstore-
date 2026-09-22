package com.ramichanstore.backend.modules.shipments.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentRecipientRequest;
import com.ramichanstore.backend.modules.shipments.dto.ShipmentRecipientResponse;
import com.ramichanstore.backend.modules.shipments.service.ShipmentRecipientService;
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
@RequestMapping("/api/shipment-recipients")
@RequiredArgsConstructor
public class ShipmentRecipientController {

    private final ShipmentRecipientService shipmentRecipientService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_VIEW')")
    public ApiResponse<List<ShipmentRecipientResponse>> findAll() {
        return ApiResponse.ok(shipmentRecipientService.findAll().stream().map(ShipmentRecipientResponse::from).toList());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_MANAGE')")
    public ApiResponse<ShipmentRecipientResponse> create(@Valid @RequestBody ShipmentRecipientRequest request) {
        return ApiResponse.ok("Titular del embarque creado", ShipmentRecipientResponse.from(shipmentRecipientService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_MANAGE')")
    public ApiResponse<ShipmentRecipientResponse> update(@PathVariable Long id, @Valid @RequestBody ShipmentRecipientRequest request) {
        return ApiResponse.ok("Titular del embarque actualizado", ShipmentRecipientResponse.from(shipmentRecipientService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_SHIPMENT_MANAGE')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        shipmentRecipientService.delete(id);
        return ApiResponse.ok("Titular del embarque eliminado", null);
    }
}
