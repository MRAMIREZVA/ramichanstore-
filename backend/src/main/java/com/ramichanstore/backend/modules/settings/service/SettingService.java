package com.ramichanstore.backend.modules.settings.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.ResourceNotFoundException;
import com.ramichanstore.backend.modules.settings.entity.Setting;
import com.ramichanstore.backend.modules.settings.repository.SettingRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Acceso centralizado a la configuración del sistema (settings). Reglas de negocio
 * configurables (ej. puntos por sol) SIEMPRE se leen de aquí, nunca de constantes.
 */
@Service
@RequiredArgsConstructor
public class SettingService {

    private final SettingRepository settingRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<Setting> findAll() {
        return settingRepository.findAll();
    }

    @Transactional(readOnly = true)
    public String getValue(String key) {
        return settingRepository.findByKey(key)
                .orElseThrow(() -> ResourceNotFoundException.of("Setting", key))
                .getValue();
    }

    @Transactional(readOnly = true)
    public BigDecimal getNumber(String key) {
        return new BigDecimal(getValue(key));
    }

    @Transactional
    public Setting updateValue(String key, String newValue) {
        Setting setting = settingRepository.findByKey(key)
                .orElseThrow(() -> ResourceNotFoundException.of("Setting", key));
        String oldValue = setting.getValue();
        setting.setValue(newValue);
        setting.setUpdatedAt(LocalDateTime.now());
        setting.setUpdatedBy(SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName() : "system");
        Setting saved = settingRepository.save(setting);
        auditService.log(AuditAction.UPDATE, "SETTINGS", "Setting", key, oldValue, newValue);
        return saved;
    }
}
