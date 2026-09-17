package com.ramichanstore.backend.modules.settings.dto;

import com.ramichanstore.backend.modules.settings.entity.Setting;

public record SettingResponse(Long id, String key, String value, String dataType, String category, String description) {
    public static SettingResponse from(Setting setting) {
        return new SettingResponse(setting.getId(), setting.getKey(), setting.getValue(),
                setting.getDataType(), setting.getCategory(), setting.getDescription());
    }
}
