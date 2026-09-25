package com.ramichanstore.backend.modules.payments.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Credenciales de Izipay (pago con Yape en el checkout, Fase 37) — ver `application.yml` (app.izipay.*)
 * y CLAUDE.md sección 7. Nunca hardcodear valores reales acá; vienen de application-local.yml
 * (gitignored) o de las variables de entorno IZIPAY_* en producción.
 */
@Component
@ConfigurationProperties(prefix = "app.izipay")
@Getter
@Setter
public class IzipayProperties {
    private String username;
    private String password;
    private String publicKey;
    private String hmacSha256Key;
    private String apiBaseUrl = "https://api.micuentaweb.pe";

    /** El botón de Yape en el carrito solo debe ofrecerse si las 4 credenciales están configuradas. */
    public boolean isConfigured() {
        return StringUtils.hasText(username)
                && StringUtils.hasText(password)
                && StringUtils.hasText(publicKey)
                && StringUtils.hasText(hmacSha256Key);
    }
}
