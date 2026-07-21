package com.hiliving.identity.auth.security;

import com.hiliving.identity.user.persistence.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class SessionVersionFilter extends OncePerRequestFilter {
    private final UserRepository users;

    public SessionVersionFilter(UserRepository users) { this.users = users; }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            Integer currentVersion = users.findSessionVersionById(principal.id()).orElse(null);
            if (currentVersion == null || currentVersion != principal.sessionVersion()) {
                SecurityContextHolder.clearContext();
                var session = request.getSession(false);
                if (session != null) {
                    try { session.invalidate(); } catch (IllegalStateException ignored) { /* already invalid */ }
                }
            }
        }
        filterChain.doFilter(request, response);
    }
}
