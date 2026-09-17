package com.ramichanstore.backend.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ramichanstore.backend.security.SecurityUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Punto único para registrar auditoría desde cualquier módulo de negocio.
 * Nunca se debe modificar un saldo/registro crítico sin pasar por aquí.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public void log(AuditAction action, String module, String entityName, String entityId, Object oldValue, Object newValue) {
        AuditLog entry = new AuditLog();
        entry.setAction(action);
        entry.setModule(module);
        entry.setEntityName(entityName);
        entry.setEntityId(entityId);
        entry.setOldValue(toJson(oldValue));
        entry.setNewValue(toJson(newValue));
        entry.setIpAddress(currentRequestIp());

        currentUser().ifPresentOrElse(
                user -> {
                    entry.setUserId(user.getId());
                    entry.setUsername(user.getUsername());
                },
                () -> entry.setUsername("system"));

        auditLogRepository.save(entry);
    }

    public void logForUsername(AuditAction action, String module, String username) {
        AuditLog entry = new AuditLog();
        entry.setAction(action);
        entry.setModule(module);
        entry.setUsername(username);
        entry.setIpAddress(currentRequestIp());
        auditLogRepository.save(entry);
    }

    private java.util.Optional<SecurityUser> currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SecurityUser securityUser) {
            return java.util.Optional.of(securityUser);
        }
        return java.util.Optional.empty();
    }

    private String currentRequestIp() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            return attrs.getRequest().getRemoteAddr();
        }
        return null;
    }

    private String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            log.warn("No se pudo serializar valor para auditoría: {}", ex.getMessage());
            return String.valueOf(value);
        }
    }
}
