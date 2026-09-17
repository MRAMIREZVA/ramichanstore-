package com.ramichanstore.backend.modules.auth.dto;

public record LoginResponse(String accessToken, String refreshToken, String tokenType, CurrentUserResponse user) {
    public static LoginResponse of(String accessToken, String refreshToken, CurrentUserResponse user) {
        return new LoginResponse(accessToken, refreshToken, "Bearer", user);
    }
}
