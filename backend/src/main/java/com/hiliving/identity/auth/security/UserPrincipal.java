package com.hiliving.identity.auth.security;

import com.hiliving.identity.user.persistence.UserEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.Serial;
import java.io.Serializable;
import java.util.Collection;
import java.util.List;

public record UserPrincipal(
        Long id,
        String displayName,
        String username,
        String role,
        int sessionVersion,
        Collection<? extends GrantedAuthority> authorities
) implements UserDetails, Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    public static UserPrincipal from(UserEntity user) {
        return new UserPrincipal(
                user.getId(),
                user.getFirstName() + " " + user.getLastName(),
                user.getEmail(),
                user.getRole().name(),
                user.getSessionVersion(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }

    @Override public String getPassword() { return ""; }
    @Override public String getUsername() { return username; }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
