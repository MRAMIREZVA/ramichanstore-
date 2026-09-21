package com.ramichanstore.backend.modules.users.dto;

import com.ramichanstore.backend.modules.users.entity.Permission;

public record PermissionResponse(Long id, String code, String module, String description) {
    public static PermissionResponse from(Permission p) {
        return new PermissionResponse(p.getId(), p.getCode(), p.getModule(), p.getDescription());
    }
}
