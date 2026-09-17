package com.ramichanstore.backend.modules.settings.controller;

import com.ramichanstore.backend.common.dto.ApiResponse;
import com.ramichanstore.backend.modules.settings.dto.SettingResponse;
import com.ramichanstore.backend.modules.settings.dto.UpdateSettingRequest;
import com.ramichanstore.backend.modules.settings.service.SettingService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingController {

    private final SettingService settingService;

    @GetMapping
    @PreAuthorize("hasAuthority('PERM_SETTINGS_VIEW')")
    public ApiResponse<List<SettingResponse>> findAll() {
        List<SettingResponse> settings = settingService.findAll().stream().map(SettingResponse::from).toList();
        return ApiResponse.ok(settings);
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasAuthority('PERM_SETTINGS_EDIT')")
    public ApiResponse<SettingResponse> updateValue(@PathVariable String key, @Valid @RequestBody UpdateSettingRequest request) {
        return ApiResponse.ok("Configuración actualizada", SettingResponse.from(settingService.updateValue(key, request.value())));
    }
}
