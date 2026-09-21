package com.ramichanstore.backend.audit;

import java.time.LocalDateTime;

public record AuditLogResponse(
        Long id, Long userId, String username, AuditAction action, String module,
        String entityName, String entityId, String oldValue, String newValue,
        String ipAddress, LocalDateTime createdAt) {

    public static AuditLogResponse from(AuditLog log) {
        return new AuditLogResponse(
                log.getId(), log.getUserId(), log.getUsername(), log.getAction(), log.getModule(),
                log.getEntityName(), log.getEntityId(), log.getOldValue(), log.getNewValue(),
                log.getIpAddress(), log.getCreatedAt());
    }
}
