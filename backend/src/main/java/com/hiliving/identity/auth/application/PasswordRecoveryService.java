package com.hiliving.identity.auth.application;

import com.hiliving.admin.audit.AuditService;
import com.hiliving.api.error.ApiRequestException;
import com.hiliving.email.EmailEventType;
import com.hiliving.email.EmailPayloads;
import com.hiliving.email.EmailProperties;
import com.hiliving.email.TokenProtector;
import com.hiliving.email.outbox.EmailOutboxService;
import com.hiliving.identity.auth.api.PasswordResetConfirmRequest;
import com.hiliving.identity.auth.persistence.PasswordResetTokenEntity;
import com.hiliving.identity.auth.persistence.PasswordResetTokenRepository;
import com.hiliving.identity.user.application.IdentityNormalizer;
import com.hiliving.identity.user.persistence.UserEntity;
import com.hiliving.identity.user.persistence.UserRepository;
import com.hiliving.identity.user.persistence.UserStatus;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;

@Service
public class PasswordRecoveryService {
    public static final String REQUEST_MESSAGE = "If an account exists for that email, password reset instructions have been sent.";
    public static final String CONFIRMED_MESSAGE = "Password has been reset successfully. Please sign in again.";

    private final UserRepository users;
    private final PasswordResetTokenRepository resetTokens;
    private final IdentityNormalizer normalizer;
    private final PasswordPolicy passwordPolicy;
    private final PasswordEncoder passwordEncoder;
    private final SecureTokenService secureTokens;
    private final TokenProtector tokenProtector;
    private final EmailOutboxService outbox;
    private final EmailProperties properties;
    private final RateLimitService rateLimits;
    private final AuditService audit;
    private final Clock clock;
    private final String dummyPasswordHash;

    public PasswordRecoveryService(UserRepository users, PasswordResetTokenRepository resetTokens,
                                   IdentityNormalizer normalizer, PasswordPolicy passwordPolicy,
                                   PasswordEncoder passwordEncoder, SecureTokenService secureTokens,
                                   TokenProtector tokenProtector, EmailOutboxService outbox,
                                   EmailProperties properties, RateLimitService rateLimits,
                                   AuditService audit, Clock clock) {
        this.users = users; this.resetTokens = resetTokens; this.normalizer = normalizer;
        this.passwordPolicy = passwordPolicy; this.passwordEncoder = passwordEncoder; this.secureTokens = secureTokens;
        this.tokenProtector = tokenProtector; this.outbox = outbox; this.properties = properties;
        this.rateLimits = rateLimits; this.audit = audit; this.clock = clock;
        this.dummyPasswordHash = passwordEncoder.encode("password reset timing comparison 1841");
    }

    @Transactional
    public void request(String submittedEmail, String requestedIp) {
        String email = normalizer.email(submittedEmail);
        rateLimits.check("password-reset-email", email, properties.rateLimit().resetRequestLimit(),
                properties.rateLimit().resetRequestWindow());
        rateLimits.check("password-reset-ip", requestedIp, properties.rateLimit().resetRequestLimit(),
                properties.rateLimit().resetRequestWindow());
        UserEntity user = users.findByEmail(email).orElse(null);
        passwordEncoder.matches("password reset timing comparison 1841", dummyPasswordHash);
        if (user == null || user.getStatus() != UserStatus.ACTIVE || !user.isEmailVerified()) return;

        Instant now = Instant.now(clock);
        resetTokens.invalidateUnused(user.getId(), now);
        SecureTokenService.IssuedToken issued = secureTokens.issue();
        Instant expiresAt = now.plus(properties.passwordResetExpiry());
        PasswordResetTokenEntity saved = resetTokens.saveAndFlush(
                new PasswordResetTokenEntity(user, issued.hash(), expiresAt, now, requestedIp));
        outbox.enqueue("password-reset:" + saved.getId(), EmailEventType.PASSWORD_RESET,
                user.getEmail(), "HiLiving нууц үг сэргээх хүсэлт", "password-reset",
                new EmailPayloads.PasswordReset(user.getFirstName(), tokenProtector.protect(issued.raw()), expiresAt));
    }

    @Transactional
    public void confirm(PasswordResetConfirmRequest request, String requestedIp) {
        rateLimits.check("password-reset-confirm-ip", requestedIp, properties.rateLimit().resetConfirmLimit(),
                properties.rateLimit().resetConfirmWindow());
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new ApiRequestException(HttpStatus.BAD_REQUEST, "PASSWORD_CONFIRMATION_MISMATCH", "Passwords do not match");
        }
        passwordPolicy.validate(request.newPassword());
        String rawToken = normalizeToken(request.token());
        PasswordResetTokenEntity token = resetTokens.findByHashForUpdate(secureTokens.hash(rawToken))
                .orElseThrow(this::invalidToken);
        Instant now = Instant.now(clock);
        if (!secureTokens.matches(rawToken, token.getTokenHash()) || token.getUsedAt() != null
                || !token.getExpiresAt().isAfter(now)) throw invalidToken();

        UserEntity user = token.getUser();
        user.changePassword(passwordEncoder.encode(request.newPassword()));
        user.invalidateSessions();
        token.consume(now);
        resetTokens.invalidateUnused(user.getId(), now);
        outbox.enqueue("password-reset-confirmation:" + token.getId(), EmailEventType.PASSWORD_RESET_CONFIRMATION,
                user.getEmail(), "HiLiving нууц үг шинэчлэгдлээ", "password-reset-confirmation",
                new EmailPayloads.PasswordResetConfirmation(user.getFirstName()));
        audit.record("PASSWORD_RESET_COMPLETED", "USER", user.getId(), "all prior sessions invalidated");
    }

    private String normalizeToken(String value) {
        String token = value == null ? "" : value.trim();
        if (token.length() < 40 || token.length() > 200 || !token.matches("^[A-Za-z0-9_-]+$")) throw invalidToken();
        return token;
    }

    private ApiRequestException invalidToken() {
        return new ApiRequestException(HttpStatus.BAD_REQUEST, "PASSWORD_RESET_TOKEN_INVALID",
                "Password reset token is invalid or expired");
    }
}
