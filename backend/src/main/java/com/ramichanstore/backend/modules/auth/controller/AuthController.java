package com.ramichanstore.backend.modules.auth.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.auth.dto.CurrentUserResponse;
import com.ramichanstore.backend.modules.auth.dto.LoginRequest;
import com.ramichanstore.backend.modules.auth.dto.LoginResponse;
import com.ramichanstore.backend.modules.auth.dto.RefreshTokenRequest;
import com.ramichanstore.backend.modules.auth.service.AuthService;
import com.ramichanstore.backend.security.SecurityUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Inicio de sesión exitoso", authService.login(request.usernameOrEmail(), request.password()));
    }

    @PostMapping("/refresh")
    public ApiResponse<LoginResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.ok(authService.refresh(request.refreshToken()));
    }

    @GetMapping("/me")
    public ApiResponse<CurrentUserResponse> me(@AuthenticationPrincipal SecurityUser securityUser) {
        return ApiResponse.ok(CurrentUserResponse.from(securityUser));
    }
}
