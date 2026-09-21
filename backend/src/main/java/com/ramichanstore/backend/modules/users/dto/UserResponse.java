package com.ramichanstore.backend.modules.users.dto;

import com.ramichanstore.backend.modules.users.entity.User;
import java.time.LocalDateTime;

public record UserResponse(
        Long id, String username, String email, String fullName,
        Long roleId, String roleName, boolean active, LocalDateTime lastLoginAt, LocalDateTime createdAt) {

    public static UserResponse from(User u) {
        return new UserResponse(
                u.getId(), u.getUsername(), u.getEmail(), u.getFullName(),
                u.getRole().getId(), u.getRole().getName(), u.isActive(), u.getLastLoginAt(), u.getCreatedAt());
    }
}
