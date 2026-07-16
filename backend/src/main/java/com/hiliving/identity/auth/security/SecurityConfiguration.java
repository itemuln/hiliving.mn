package com.hiliving.identity.auth.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import com.hiliving.identity.user.persistence.UserRepository;

@Configuration
public class SecurityConfiguration {

    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    UserDetailsService userDetailsService(UserRepository users) {
        return username -> users.findByEmail(username)
                .map(user -> User.withUsername(user.getEmail())
                        .password(user.getPasswordHash())
                        .roles(user.getRole().name())
                        .disabled(user.getStatus() != com.hiliving.identity.user.persistence.UserStatus.ACTIVE)
                        .build())
                .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException("User not found"));
    }

    @Bean
    SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            ApiSecurityErrorWriter errors,
            SecurityContextRepository securityContextRepository,
            @Value("${server.servlet.session.cookie.secure:false}") boolean secureCookies
    ) throws Exception {
        CookieCsrfTokenRepository csrfRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfRepository.setCookieCustomizer(cookie -> cookie.sameSite("Lax").path("/").secure(secureCookies));

        http
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfRepository)
                        .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler())
                )
                .cors(Customizer.withDefaults())
                .securityContext(context -> context
                        .requireExplicitSave(true)
                        .securityContextRepository(securityContextRepository)
                )
                .sessionManagement(session -> session.sessionFixation(fixation -> fixation.migrateSession()))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/categories/**", "/api/v1/brands/**", "/api/v1/products/**",
                                "/api/v1/banners/**", "/api/v1/news/**",
                                "/media/**",
                                "/api/v1/auth/csrf", "/actuator/health", "/actuator/health/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.HEAD, "/media/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/register", "/api/v1/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/logout").authenticated()
                        .requestMatchers("/api/v1/account/**").authenticated()
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .anyRequest().denyAll()
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) -> errors.write(
                                request, response, HttpServletResponse.SC_UNAUTHORIZED,
                                "AUTHENTICATION_REQUIRED", "Authentication is required"
                        ))
                        .accessDeniedHandler((request, response, exception) -> errors.write(
                                request, response, HttpServletResponse.SC_FORBIDDEN,
                                "ACCESS_DENIED", "Access is denied"
                        ))
                )
                .logout(logout -> logout
                        .logoutUrl("/api/v1/auth/logout")
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                        .deleteCookies("JSESSIONID", "XSRF-TOKEN")
                        .logoutSuccessHandler((request, response, authentication) -> response.setStatus(HttpServletResponse.SC_NO_CONTENT))
                );
        return http.build();
    }
}
