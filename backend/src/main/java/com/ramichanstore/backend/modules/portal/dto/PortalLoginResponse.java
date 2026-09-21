package com.ramichanstore.backend.modules.portal.dto;

public record PortalLoginResponse(String accessToken, String refreshToken, String tokenType, PortalProfileResponse customer) {
    public static PortalLoginResponse of(String accessToken, String refreshToken, PortalProfileResponse customer) {
        return new PortalLoginResponse(accessToken, refreshToken, "Bearer", customer);
    }
}
