package com.ramichanstore.backend.modules.orderrequests.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.common.dto.PageResponse;
import com.ramichanstore.backend.modules.orderrequests.dto.ConvertToReservationsRequest;
import com.ramichanstore.backend.modules.orderrequests.dto.OrderRequestResponse;
import com.ramichanstore.backend.modules.orderrequests.dto.OrderRequestStatusResponse;
import com.ramichanstore.backend.modules.orderrequests.dto.OrderRequestSubmission;
import com.ramichanstore.backend.modules.orderrequests.dto.RejectOrderRequestRequest;
import com.ramichanstore.backend.modules.orderrequests.entity.OrderRequestStatus;
import com.ramichanstore.backend.modules.orderrequests.service.OrderRequestService;
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

/**
 * `POST /api/order-requests` es pública a propósito (ver SecurityConfig,
 * permitAll solo para este método+ruta) — es el único endpoint del backend
 * que un visitante anónimo del catálogo puede llamar para enviar su carrito.
 * El resto exige sesión de staff con los permisos PERM_ORDER_REQUEST_*.
 */
@RestController
@RequestMapping("/api/order-requests")
@RequiredArgsConstructor
public class OrderRequestController {

    private final OrderRequestService orderRequestService;

    @PostMapping
    public ApiResponse<OrderRequestResponse> submit(@Valid @RequestBody OrderRequestSubmission request) {
        return ApiResponse.ok("Pedido enviado", orderRequestService.submit(request));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_ORDER_REQUEST_VIEW')")
    public ApiResponse<PageResponse<OrderRequestResponse>> search(
            @RequestParam(required = false) OrderRequestStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(PageResponse.from(orderRequestService.search(status, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_ORDER_REQUEST_VIEW')")
    public ApiResponse<OrderRequestResponse> findById(@PathVariable Long id) {
        return ApiResponse.ok(orderRequestService.findResponseById(id));
    }

    /**
     * Pública a propósito (ver SecurityConfig) — el checkout la usa para hacer polling mientras
     * espera la confirmación IPN de un pago con Yape (Fase 37). Solo expone estado/id de venta,
     * nunca los datos del invitado.
     */
    @GetMapping("/{id}/status")
    public ApiResponse<OrderRequestStatusResponse> status(@PathVariable Long id) {
        return ApiResponse.ok(OrderRequestStatusResponse.from(orderRequestService.findById(id)));
    }

    @PostMapping("/{id}/convert")
    @PreAuthorize("hasAuthority('PERM_ORDER_REQUEST_MANAGE')")
    public ApiResponse<OrderRequestResponse> convert(@PathVariable Long id, @AuthenticationPrincipal SecurityUser currentUser) {
        return ApiResponse.ok("Pedido convertido a venta", orderRequestService.convertToSale(id, currentUser));
    }

    @PostMapping("/{id}/convert-to-reservations")
    @PreAuthorize("hasAuthority('PERM_ORDER_REQUEST_MANAGE')")
    public ApiResponse<OrderRequestResponse> convertToReservations(
            @PathVariable Long id, @Valid @RequestBody ConvertToReservationsRequest request,
            @AuthenticationPrincipal SecurityUser currentUser) {
        return ApiResponse.ok("Pedido convertido a reserva(s) de preventa",
                orderRequestService.convertToReservations(id, request, currentUser));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('PERM_ORDER_REQUEST_MANAGE')")
    public ApiResponse<OrderRequestResponse> reject(@PathVariable Long id, @Valid @RequestBody RejectOrderRequestRequest request) {
        return ApiResponse.ok("Pedido rechazado", orderRequestService.reject(id, request.reason()));
    }
}
