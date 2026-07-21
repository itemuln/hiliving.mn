package com.hiliving.identity.auth.application;

import com.hiliving.admin.audit.AuditService;
import com.hiliving.api.error.ApiRequestException;
import com.hiliving.email.EmailEventType;
import com.hiliving.email.EmailPayloads;
import com.hiliving.email.EmailProperties;
import com.hiliving.email.TokenProtector;
import com.hiliving.email.outbox.EmailOutboxService;
import com.hiliving.identity.auth.persistence.EmailVerificationTokenEntity;
import com.hiliving.identity.auth.persistence.EmailVerificationTokenRepository;
import com.hiliving.identity.user.persistence.UserEntity;
import com.hiliving.identity.user.persistence.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;

@Service
public class EmailVerificationService {
    public static final String REQUEST_MESSAGE = "If verification is needed, instructions have been sent.";
    public static final String CONFIRMED_MESSAGE = "Email address verified successfully.";

    private final UserRepository users;
    private final EmailVerificationTokenRepository verificationTokens;
    private final SecureTokenService secureTokens;
    private final TokenProtector tokenProtector;
    private final EmailOutboxService outbox;
    private final EmailProperties properties;
    private final RateLimitService rateLimits;
    private final AuditService audit;
    private final Clock clock;

    public EmailVerificationService(UserRepository users, EmailVerificationTokenRepository verificationTokens,
                                    SecureTokenService secureTokens, TokenProtector tokenProtector,
                                    EmailOutboxService outbox, EmailProperties properties,
                                    RateLimitService rateLimits, AuditService audit, Clock clock) {
        this.users = users; this.verificationTokens = verificationTokens; this.secureTokens = secureTokens;
        this.tokenProtector = tokenProtector; this.outbox = outbox; this.properties = properties;
        this.rateLimits = rateLimits; this.audit = audit; this.clock = clock;
    }

    @Transactional
    public void issueForRegistration(UserEntity user, String requestedIp) {
        issue(user, requestedIp);
    }

    @Transactional
    public void request(Long userId, String requestedIp) {
        rateLimits.check("email-verification-user", String.valueOf(userId),
                properties.rateLimit().verificationLimit(), properties.rateLimit().verificationWindow());
        rateLimits.check("email-verification-ip", requestedIp,
                properties.rateLimit().verificationLimit(), properties.rateLimit().verificationWindow());
        UserEntity user = users.findByIdForUpdate(userId).orElse(null);
        if (user != null && !user.isEmailVerified()) issue(user, requestedIp);
    }

    @Transactional
    public void confirm(String rawToken) {
        String normalized = normalizeToken(rawToken);
        EmailVerificationTokenEntity token = verificationTokens.findByHashForUpdate(secureTokens.hash(normalized))
                .orElseThrow(this::invalidToken);
        Instant now = Instant.now(clock);
        if (!secureTokens.matches(normalized, token.getTokenHash())) throw invalidToken();
        if (token.getUsedAt() != null) {
            if (token.getUser().isEmailVerified()) return;
            throw invalidToken();
        }
        if (!token.getExpiresAt().isAfter(now)) {
            throw new ApiRequestException(HttpStatus.BAD_REQUEST, "EMAIL_VERIFICATION_TOKEN_EXPIRED",
                    "Verification token is invalid or expired");
        }
        UserEntity user = token.getUser();
        user.verifyEmail(now);
        token.consume(now);
        verificationTokens.invalidateUnused(user.getId(), now);
        audit.record("EMAIL_VERIFIED", "USER", user.getId(), "password account email verification");
    }

    private void issue(UserEntity user, String requestedIp) {
        Instant now = Instant.now(clock);
        verificationTokens.invalidateUnused(user.getId(), now);
        SecureTokenService.IssuedToken issued = secureTokens.issue();
        Instant expiresAt = now.plus(properties.verificationExpiry());
        EmailVerificationTokenEntity saved = verificationTokens.saveAndFlush(
                new EmailVerificationTokenEntity(user, issued.hash(), expiresAt, now, requestedIp));
        outbox.enqueue("email-verification:" + saved.getId(), EmailEventType.EMAIL_VERIFICATION,
                user.getEmail(), "HiLiving имэйл хаягаа баталгаажуулна уу", "email-verification",
                new EmailPayloads.Verification(user.getFirstName(), tokenProtector.protect(issued.raw()), expiresAt));
    }

    private String normalizeToken(String value) {
        String token = value == null ? "" : value.trim();
        if (token.length() < 40 || token.length() > 200 || !token.matches("^[A-Za-z0-9_-]+$")) throw invalidToken();
        return token;
    }

    private ApiRequestException invalidToken() {
        return new ApiRequestException(HttpStatus.BAD_REQUEST, "EMAIL_VERIFICATION_TOKEN_INVALID",
                "Verification token is invalid or expired");
    }
}
