package com.ramichanstore.backend.security;

import com.ramichanstore.backend.modules.customers.entity.Customer;
import java.util.Collection;
import java.util.List;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Principal de un cliente autenticado en el portal (solo lectura). Deliberadamente
 * NO extiende ni imita {@link SecurityUser}: solo obtiene {@code ROLE_CUSTOMER},
 * nunca un {@code PERM_*}, así que no puede alcanzar ningún endpoint admin
 * protegido con {@code hasAuthority('PERM_...')} sin importar qué se olvide de
 * configurar — el aislamiento es por diseño del propio modelo de autoridades.
 */
@Getter
public class CustomerPrincipal implements UserDetails {

    private final Customer customer;

    public CustomerPrincipal(Customer customer) {
        this.customer = customer;
    }

    public Long getId() {
        return customer.getId();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
    }

    @Override
    public String getPassword() {
        return customer.getPortalPasswordHash();
    }

    @Override
    public String getUsername() {
        return customer.getPortalUsername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return customer.isPortalEnabled();
    }
}
