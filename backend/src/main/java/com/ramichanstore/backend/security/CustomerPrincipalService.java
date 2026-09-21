package com.ramichanstore.backend.security;

import com.ramichanstore.backend.modules.customers.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Equivalente a {@link CustomUserDetailsService} pero para clientes del portal — tablas separadas, nunca se mezclan. */
@Service
@RequiredArgsConstructor
public class CustomerPrincipalService {

    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public CustomerPrincipal loadByPortalUsername(String portalUsername) {
        var customer = customerRepository.findByPortalUsernameIgnoreCase(portalUsername)
                .orElseThrow(() -> new UsernameNotFoundException("Cliente no encontrado: " + portalUsername));
        return new CustomerPrincipal(customer);
    }
}
