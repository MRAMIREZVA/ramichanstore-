package com.ramichanstore.backend.modules.preorders.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.common.dto.PageResponse;
import com.ramichanstore.backend.modules.preorders.dto.CustomerReservationResponse;
import com.ramichanstore.backend.modules.preorders.dto.PreorderCustomerPaymentRequest;
import com.ramichanstore.backend.modules.preorders.dto.PreorderCustomerPaymentResponse;
import com.ramichanstore.backend.modules.preorders.dto.PreorderCustomerRequest;
import com.ramichanstore.backend.modules.preorders.dto.PreorderCustomerResponse;
import com.ramichanstore.backend.modules.preorders.dto.PreorderRequest;
import com.ramichanstore.backend.modules.preorders.dto.PreorderResponse;
import com.ramichanstore.backend.modules.preorders.dto.UpdateReservationPriceRequest;
import com.ramichanstore.backend.modules.preorders.entity.PreorderStatus;
import com.ramichanstore.backend.modules.preorders.service.PreorderService;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/preorders")
@RequiredArgsConstructor
public class PreorderController {

    private final PreorderService preorderService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_PREORDER_VIEW')")
    public ApiResponse<PageResponse<PreorderResponse>> search(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PreorderStatus status,
            @PageableDefault(size = 20, sort = "startDate") Pageable pageable) {
        return ApiResponse.ok(PageResponse.from(preorderService.search(search, status, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_PREORDER_VIEW')")
    public ApiResponse<PreorderResponse> findById(@PathVariable Long id) {
        return ApiResponse.ok(preorderService.findResponseById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_PREORDER_CREATE')")
    public ApiResponse<PreorderResponse> create(@Valid @RequestBody PreorderRequest request) {
        return ApiResponse.ok("Preventa creada", preorderService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_PREORDER_EDIT')")
    public ApiResponse<PreorderResponse> update(@PathVariable Long id, @Valid @RequestBody PreorderRequest request) {
        return ApiResponse.ok("Preventa actualizada", preorderService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_PREORDER_DELETE')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        preorderService.delete(id);
        return ApiResponse.ok("Preventa eliminada", null);
    }

    @GetMapping("/{id}/reservations")
    @PreAuthorize("hasAuthority('PERM_PREORDER_VIEW')")
    public ApiResponse<List<PreorderCustomerResponse>> listReservations(@PathVariable Long id) {
        return ApiResponse.ok(preorderService.listReservations(id));
    }

    @GetMapping("/reservations")
    @PreAuthorize("hasAuthority('PERM_PREORDER_VIEW')")
    public ApiResponse<List<CustomerReservationResponse>> listReservationsByCustomer(@RequestParam Long customerId) {
        return ApiResponse.ok(preorderService.listReservationsByCustomer(customerId));
    }

    /** Para "Pedidos → Preventas": todas las reservas de todas las campañas, paginadas (ver sección 9 del roadmap). */
    @GetMapping("/reservations/search")
    @PreAuthorize("hasAuthority('PERM_PREORDER_VIEW')")
    public ApiResponse<PageResponse<PreorderCustomerResponse>> searchReservations(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PreorderStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(PageResponse.from(preorderService.searchReservations(search, status, from, to, pageable)));
    }

    @PostMapping("/{id}/reservations")
    @PreAuthorize("hasAuthority('PERM_PREORDER_CREATE')")
    public ApiResponse<PreorderCustomerResponse> addReservation(
            @PathVariable Long id, @Valid @RequestBody PreorderCustomerRequest request,
            @AuthenticationPrincipal SecurityUser currentUser) {
        return ApiResponse.ok("Reserva registrada", preorderService.addReservation(id, request, currentUser));
    }

    @DeleteMapping("/{id}/reservations/{reservationId}")
    @PreAuthorize("hasAuthority('PERM_PREORDER_DELETE')")
    public ApiResponse<Void> cancelReservation(@PathVariable Long id, @PathVariable Long reservationId) {
        preorderService.cancelReservation(id, reservationId);
        return ApiResponse.ok("Reserva cancelada", null);
    }

    @GetMapping("/reservations/{reservationId}/payments")
    @PreAuthorize("hasAuthority('PERM_PREORDER_VIEW')")
    public ApiResponse<List<PreorderCustomerPaymentResponse>> listPayments(@PathVariable Long reservationId) {
        return ApiResponse.ok(preorderService.listPayments(reservationId));
    }

    @PostMapping("/reservations/{reservationId}/payments")
    @PreAuthorize("hasAuthority('PERM_PREORDER_CREATE')")
    public ApiResponse<PreorderCustomerPaymentResponse> registerPayment(
            @PathVariable Long reservationId, @Valid @RequestBody PreorderCustomerPaymentRequest request,
            @AuthenticationPrincipal SecurityUser currentUser) {
        return ApiResponse.ok("Abono registrado", preorderService.registerPayment(reservationId, request, currentUser));
    }

    @PutMapping("/reservations/{reservationId}/price")
    @PreAuthorize("hasAuthority('PERM_PREORDER_CREATE')")
    public ApiResponse<PreorderCustomerResponse> updateReservationPrice(
            @PathVariable Long reservationId, @Valid @RequestBody UpdateReservationPriceRequest request) {
        return ApiResponse.ok("Precio actualizado", preorderService.updateUnitPrice(reservationId, request.unitPrice()));
    }
}
