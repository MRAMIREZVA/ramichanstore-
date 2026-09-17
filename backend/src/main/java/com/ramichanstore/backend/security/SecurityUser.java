package com.ramichanstore.backend.security;

import com.ramichanstore.backend.modules.users.entity.User;
import java.util.Collection;
import java.util.List;
import java.util.stream.Stream;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Adapta {@link User} a Spring Security. Expone dos niveles de autoridad:
 * ROLE_&lt;nombre&gt; para hasRole(...) y PERM_&lt;code&gt; para autorización fina por permiso,
 * lo que permite crecer a permisos granulares sin tocar este adaptador.
 */
@Getter
public class SecurityUser implements UserDetails {

    private final User user;

    public SecurityUser(User user) {
        this.user = user;
    }

    public Long getId() {
        return user.getId();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Stream<GrantedAuthority> roleAuthority = Stream.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName()));
        Stream<GrantedAuthority> permissionAuthorities = user.getRole().getPermissions().stream()
                .map(p -> new SimpleGrantedAuthority("PERM_" + p.getCode()));
        return Stream.concat(roleAuthority, permissionAuthorities).toList();
    }

    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return user.getUsername();
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
        return user.isActive();
    }

    public List<String> getPermissionCodes() {
        return user.getRole().getPermissions().stream().map(p -> p.getCode()).toList();
    }
}
