package com.ramichanstore.backend.security.jwt;

import com.ramichanstore.backend.security.CustomerPrincipal;
import com.ramichanstore.backend.security.SecurityUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Emite tokens para dos tipos de principal distintos (STAFF = SecurityUser,
 * CUSTOMER = CustomerPrincipal) marcados con el claim {@code principalType}.
 * Un token viejo sin ese claim se trata como STAFF por compatibilidad — ver
 * {@code JwtAuthenticationFilter}.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private static final String CLAIM_TYPE = "type";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";
    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_PRINCIPAL_TYPE = "principalType";
    public static final String PRINCIPAL_STAFF = "STAFF";
    public static final String PRINCIPAL_CUSTOMER = "CUSTOMER";

    private final JwtProperties jwtProperties;

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(SecurityUser user) {
        return buildToken(user.getUsername(), user.getUser().getRole().getName(), PRINCIPAL_STAFF,
                TYPE_ACCESS, jwtProperties.getAccessTokenExpirationMs());
    }

    public String generateRefreshToken(SecurityUser user) {
        return buildToken(user.getUsername(), user.getUser().getRole().getName(), PRINCIPAL_STAFF,
                TYPE_REFRESH, jwtProperties.getRefreshTokenExpirationMs());
    }

    public String generateCustomerAccessToken(CustomerPrincipal customer) {
        return buildToken(customer.getUsername(), "CUSTOMER", PRINCIPAL_CUSTOMER,
                TYPE_ACCESS, jwtProperties.getAccessTokenExpirationMs());
    }

    public String generateCustomerRefreshToken(CustomerPrincipal customer) {
        return buildToken(customer.getUsername(), "CUSTOMER", PRINCIPAL_CUSTOMER,
                TYPE_REFRESH, jwtProperties.getRefreshTokenExpirationMs());
    }

    private String buildToken(String subject, String role, String principalType, String type, long expirationMs) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .subject(subject)
                .claim(CLAIM_ROLE, role)
                .claim(CLAIM_TYPE, type)
                .claim(CLAIM_PRINCIPAL_TYPE, principalType)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey())
                .compact();
    }

    public boolean isValid(String token) {
        try {
            Jwts.parser().verifyWith(signingKey()).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("Token JWT inválido: {}", ex.getMessage());
            return false;
        }
    }

    public boolean isRefreshToken(String token) {
        return TYPE_REFRESH.equals(extractClaims(token).get(CLAIM_TYPE, String.class));
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    /** {@code PRINCIPAL_STAFF} por defecto: los tokens emitidos antes de este cambio no traen el claim. */
    public String extractPrincipalType(String token) {
        String value = extractClaims(token).get(CLAIM_PRINCIPAL_TYPE, String.class);
        return value != null ? value : PRINCIPAL_STAFF;
    }

    private Claims extractClaims(String token) {
        return Jwts.parser().verifyWith(signingKey()).build()
                .parseSignedClaims(token).getPayload();
    }
}
