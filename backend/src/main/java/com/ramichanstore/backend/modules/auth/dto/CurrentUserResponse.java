package com.ramichanstore.backend.modules.auth.dto;

import com.ramichanstore.backend.security.SecurityUser;
import java.util.List;

public record CurrentUserResponse(
        Long id, String username, String email, String fullName, String role, List<String> permissions) {

    public static CurrentUserResponse from(SecurityUser securityUser) {
        var user = securityUser.getUser();
        return new CurrentUserResponse(
                user.getId(), user.getUsername(), user.getEmail(), user.getFullName(),
                user.getRole().getName(), securityUser.getPermissionCodes());
    }
}
