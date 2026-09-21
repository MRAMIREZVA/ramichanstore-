package com.ramichanstore.backend.modules.users.dto;

import com.ramichanstore.backend.modules.users.entity.Role;
import java.util.List;

public record RoleResponse(Long id, String name, String description, List<PermissionResponse> permissions) {
    public static RoleResponse from(Role r) {
        List<PermissionResponse> permissions = r.getPermissions().stream()
                .map(PermissionResponse::from)
                .sorted((a, b) -> a.code().compareTo(b.code()))
                .toList();
        return new RoleResponse(r.getId(), r.getName(), r.getDescription(), permissions);
    }
}
