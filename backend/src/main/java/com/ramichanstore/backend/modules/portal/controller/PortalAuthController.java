package com.ramichanstore.backend.modules.portal.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.portal.dto.PortalLoginRequest;
import com.ramichanstore.backend.modules.portal.dto.PortalLoginResponse;
import com.ramichanstore.backend.modules.portal.dto.PortalProfileResponse;
import com.ramichanstore.backend.modules.portal.dto.PortalRefreshRequest;
import com.ramichanstore.backend.modules.portal.service.PortalAuthService;
import com.ramichanstore.backend.security.CustomerPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portal/auth")
@RequiredArgsConstructor
public class PortalAuthController {

    private final PortalAuthService portalAuthService;

    @PostMapping("/login")
    public ApiResponse<PortalLoginResponse> login(@Valid @RequestBody PortalLoginRequest request) {
        return ApiResponse.ok("Inicio de sesión exitoso", portalAuthService.login(request.username(), request.password()));
    }

    @PostMapping("/refresh")
    public ApiResponse<PortalLoginResponse> refresh(@Valid @RequestBody PortalRefreshRequest request) {
        return ApiResponse.ok(portalAuthService.refresh(request.refreshToken()));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ApiResponse<PortalProfileResponse> me(@AuthenticationPrincipal CustomerPrincipal principal) {
        return ApiResponse.ok(PortalProfileResponse.from(principal.getCustomer()));
    }
}
