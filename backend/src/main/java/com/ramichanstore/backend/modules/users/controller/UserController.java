package com.ramichanstore.backend.modules.users.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.users.dto.ResetPasswordRequest;
import com.ramichanstore.backend.modules.users.dto.UserCreateRequest;
import com.ramichanstore.backend.modules.users.dto.UserResponse;
import com.ramichanstore.backend.modules.users.dto.UserUpdateRequest;
import com.ramichanstore.backend.modules.users.service.UserService;
import com.ramichanstore.backend.security.SecurityUser;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_USER_VIEW')")
    public ApiResponse<List<UserResponse>> findAll() {
        return ApiResponse.ok(userService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_USER_VIEW')")
    public ApiResponse<UserResponse> findById(@PathVariable Long id) {
        return ApiResponse.ok(userService.findResponseById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PERM_USER_CREATE')")
    public ApiResponse<UserResponse> create(@Valid @RequestBody UserCreateRequest request) {
        return ApiResponse.ok("Usuario creado", userService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_USER_EDIT')")
    public ApiResponse<UserResponse> update(
            @PathVariable Long id, @Valid @RequestBody UserUpdateRequest request, @AuthenticationPrincipal SecurityUser currentUser) {
        return ApiResponse.ok("Usuario actualizado", userService.update(id, request, currentUser));
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasAuthority('PERM_USER_EDIT')")
    public ApiResponse<Void> resetPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(id, request);
        return ApiResponse.ok("Contraseña restablecida", null);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PERM_USER_DELETE')")
    public ApiResponse<Void> delete(@PathVariable Long id, @AuthenticationPrincipal SecurityUser currentUser) {
        userService.delete(id, currentUser);
        return ApiResponse.ok("Usuario eliminado", null);
    }
}
