package com.ramichanstore.backend.modules.deliveryagencies.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.deliveryagencies.dto.DeliveryAgencyRequest;
import com.ramichanstore.backend.modules.deliveryagencies.dto.DeliveryAgencyResponse;
import com.ramichanstore.backend.modules.deliveryagencies.service.DeliveryAgencyService;
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
@RequestMapping("/api/delivery-agencies")
@RequiredArgsConstructor
public class DeliveryAgencyController {

    private final DeliveryAgencyService deliveryAgencyService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_DELIVERY_VIEW')")
    public ApiResponse<List<DeliveryAgencyResponse>> findAll() {
        return ApiResponse.ok(deliveryAgencyService.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<DeliveryAgencyResponse> create(@Valid @RequestBody DeliveryAgencyRequest request) {
        return ApiResponse.ok("Agencia creada", DeliveryAgencyResponse.from(deliveryAgencyService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<DeliveryAgencyResponse> update(@PathVariable Long id, @Valid @RequestBody DeliveryAgencyRequest request) {
        return ApiResponse.ok("Agencia actualizada", DeliveryAgencyResponse.from(deliveryAgencyService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_CATALOG_MANAGE')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        deliveryAgencyService.delete(id);
        return ApiResponse.ok("Agencia eliminada", null);
    }
}
