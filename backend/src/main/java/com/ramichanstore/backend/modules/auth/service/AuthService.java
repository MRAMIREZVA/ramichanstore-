package com.ramichanstore.backend.modules.auth.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BadRequestException;
import com.ramichanstore.backend.modules.auth.dto.CurrentUserResponse;
import com.ramichanstore.backend.modules.auth.dto.LoginResponse;
import com.ramichanstore.backend.modules.users.entity.User;
import com.ramichanstore.backend.modules.users.repository.UserRepository;
import com.ramichanstore.backend.security.CustomUserDetailsService;
import com.ramichanstore.backend.security.SecurityUser;
import com.ramichanstore.backend.security.jwt.JwtTokenProvider;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String MODULE = "AUTH";

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final CustomUserDetailsService userDetailsService;
    private final AuditService auditService;

    @Transactional
    public LoginResponse login(String usernameOrEmail, String password) {
        try {
            var authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(usernameOrEmail, password));
            SecurityUser securityUser = (SecurityUser) authentication.getPrincipal();

            User user = securityUser.getUser();
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);

            String accessToken = jwtTokenProvider.generateAccessToken(securityUser);
            String refreshToken = jwtTokenProvider.generateRefreshToken(securityUser);

            auditService.log(AuditAction.LOGIN, MODULE, "User", user.getId().toString(), null, null);

            return LoginResponse.of(accessToken, refreshToken, CurrentUserResponse.from(securityUser));
        } catch (BadCredentialsException ex) {
            auditService.logForUsername(AuditAction.LOGIN_FAILED, MODULE, usernameOrEmail);
            throw ex;
        }
    }

    public LoginResponse refresh(String refreshToken) {
        if (!jwtTokenProvider.isValid(refreshToken) || !jwtTokenProvider.isRefreshToken(refreshToken)) {
            throw new BadRequestException("Refresh token inválido o expirado");
        }
        String username = jwtTokenProvider.extractUsername(refreshToken);
        SecurityUser securityUser = (SecurityUser) userDetailsService.loadUserByUsername(username);

        String newAccessToken = jwtTokenProvider.generateAccessToken(securityUser);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(securityUser);
        return LoginResponse.of(newAccessToken, newRefreshToken, CurrentUserResponse.from(securityUser));
    }
}
