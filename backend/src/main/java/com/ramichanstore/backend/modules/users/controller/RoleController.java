package com.ramichanstore.backend.modules.users.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.users.dto.PermissionResponse;
import com.ramichanstore.backend.modules.users.dto.RoleRequest;
import com.ramichanstore.backend.modules.users.dto.RoleResponse;
import com.ramichanstore.backend.modules.users.service.RoleService;
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
@RequestMapping("/api")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping("/roles")
    @PreAuthorize("hasAuthority('PERM_ROLE_MANAGE')")
    public ApiResponse<List<RoleResponse>> findAll() {
        return ApiResponse.ok(roleService.findAll());
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('PERM_ROLE_MANAGE')")
    public ApiResponse<List<PermissionResponse>> findAllPermissions() {
        return ApiResponse.ok(roleService.findAllPermissions());
    }

    @PostMapping("/roles")
    @PreAuthorize("hasAuthority('PERM_ROLE_MANAGE')")
    public ApiResponse<RoleResponse> create(@Valid @RequestBody RoleRequest request) {
        return ApiResponse.ok("Rol creado", roleService.create(request));
    }

    @PutMapping("/roles/{id}")
    @PreAuthorize("hasAuthority('PERM_ROLE_MANAGE')")
    public ApiResponse<RoleResponse> update(@PathVariable Long id, @Valid @RequestBody RoleRequest request) {
        return ApiResponse.ok("Rol actualizado", roleService.update(id, request));
    }

    @DeleteMapping("/roles/{id}")
    @PreAuthorize("hasAuthority('PERM_ROLE_MANAGE')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        roleService.delete(id);
        return ApiResponse.ok("Rol eliminado", null);
    }
}
