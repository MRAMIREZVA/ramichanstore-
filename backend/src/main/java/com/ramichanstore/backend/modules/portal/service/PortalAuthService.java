package com.ramichanstore.backend.modules.portal.service;

import com.ramichanstore.backend.audit.AuditAction;
import com.ramichanstore.backend.audit.AuditService;
import com.ramichanstore.backend.common.exception.BadRequestException;
import com.ramichanstore.backend.modules.customers.entity.Customer;
import com.ramichanstore.backend.modules.customers.repository.CustomerRepository;
import com.ramichanstore.backend.modules.portal.dto.PortalLoginResponse;
import com.ramichanstore.backend.modules.portal.dto.PortalProfileResponse;
import com.ramichanstore.backend.security.CustomerPrincipal;
import com.ramichanstore.backend.security.CustomerPrincipalService;
import com.ramichanstore.backend.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Deliberadamente NO usa {@code AuthenticationManager}: ese está cableado a
 * {@code CustomUserDetailsService} (staff). Un cliente se valida a mano contra
 * `customers.portal_*` — cero superposición con el login administrativo.
 */
@Service
@RequiredArgsConstructor
public class PortalAuthService {

    private static final String MODULE = "PORTAL_AUTH";

    private final CustomerRepository customerRepository;
    private final CustomerPrincipalService customerPrincipalService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public PortalLoginResponse login(String username, String password) {
        Customer customer = customerRepository.findByPortalUsernameIgnoreCase(username).orElse(null);
        boolean valid = customer != null && customer.isPortalEnabled() && customer.getPortalPasswordHash() != null
                && passwordEncoder.matches(password, customer.getPortalPasswordHash());
        if (!valid) {
            auditService.logForUsername(AuditAction.LOGIN_FAILED, MODULE, username);
            throw new BadCredentialsException("Usuario o contraseña incorrectos");
        }

        CustomerPrincipal principal = new CustomerPrincipal(customer);
        String accessToken = jwtTokenProvider.generateCustomerAccessToken(principal);
        String refreshToken = jwtTokenProvider.generateCustomerRefreshToken(principal);

        auditService.log(AuditAction.LOGIN, MODULE, "Customer", customer.getId().toString(), null, null);
        return PortalLoginResponse.of(accessToken, refreshToken, PortalProfileResponse.from(customer));
    }

    public PortalLoginResponse refresh(String refreshToken) {
        if (!jwtTokenProvider.isValid(refreshToken) || !jwtTokenProvider.isRefreshToken(refreshToken)
                || !JwtTokenProvider.PRINCIPAL_CUSTOMER.equals(jwtTokenProvider.extractPrincipalType(refreshToken))) {
            throw new BadRequestException("Refresh token inválido o expirado");
        }
        String username = jwtTokenProvider.extractUsername(refreshToken);
        CustomerPrincipal principal = customerPrincipalService.loadByPortalUsername(username);

        String newAccessToken = jwtTokenProvider.generateCustomerAccessToken(principal);
        String newRefreshToken = jwtTokenProvider.generateCustomerRefreshToken(principal);
        return PortalLoginResponse.of(newAccessToken, newRefreshToken, PortalProfileResponse.from(principal.getCustomer()));
    }
}
