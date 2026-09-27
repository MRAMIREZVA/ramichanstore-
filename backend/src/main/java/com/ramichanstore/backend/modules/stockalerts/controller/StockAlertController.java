package com.ramichanstore.backend.modules.stockalerts.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.stockalerts.dto.StockAlertResponse;
import com.ramichanstore.backend.modules.stockalerts.dto.StockAlertSubmission;
import com.ramichanstore.backend.modules.stockalerts.service.StockAlertService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** `POST /api/stock-alerts` es pública (ver SecurityConfig) — el resto exige PERM_STOCK_ALERT_*. */
@RestController
@RequestMapping("/api/stock-alerts")
@RequiredArgsConstructor
public class StockAlertController {

    private final StockAlertService stockAlertService;

    @PostMapping
    public ApiResponse<StockAlertResponse> submit(@Valid @RequestBody StockAlertSubmission request) {
        return ApiResponse.ok("Te avisaremos apenas vuelva a haber stock", stockAlertService.submit(request));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_STOCK_ALERT_VIEW')")
    public ApiResponse<List<StockAlertResponse>> findPendingByProduct(@RequestParam Long productId) {
        return ApiResponse.ok(stockAlertService.findPendingByProduct(productId));
    }

    @PostMapping("/{id}/notify")
    @PreAuthorize("hasAuthority('PERM_STOCK_ALERT_MANAGE')")
    public ApiResponse<StockAlertResponse> markNotified(@PathVariable Long id) {
        return ApiResponse.ok("Marcado como notificado", stockAlertService.markNotified(id));
    }
}
