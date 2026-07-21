package com.hiliving.email;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.net.URI;
import java.time.Duration;

@ConfigurationProperties("hiliving.email")
public record EmailProperties(
        boolean deliveryEnabled,
        boolean manualTestEnabled,
        String testRecipient,
        String fromAddress,
        String fromName,
        String supportAddress,
        String publicUrl,
        String tokenProtectionKey,
        Duration verificationExpiry,
        Duration passwordResetExpiry,
        Outbox outbox,
        RateLimit rateLimit
) {
    public record Outbox(
            int batchSize,
            int maxAttempts,
            Duration initialRetryDelay,
            Duration maxRetryDelay,
            Duration processingTimeout
    ) {}

    public record RateLimit(
            int maxEntries,
            int verificationLimit,
            Duration verificationWindow,
            int resetRequestLimit,
            Duration resetRequestWindow,
            int resetConfirmLimit,
            Duration resetConfirmWindow
    ) {}

    @PostConstruct
    void validate() {
        URI base = URI.create(publicUrl);
        if (!("http".equalsIgnoreCase(base.getScheme()) || "https".equalsIgnoreCase(base.getScheme()))
                || base.getHost() == null || base.getQuery() != null || base.getFragment() != null) {
            throw new IllegalStateException("APP_PUBLIC_URL must be an absolute HTTP(S) origin or base path without query or fragment");
        }
        if (deliveryEnabled && (tokenProtectionKey == null || tokenProtectionKey.isBlank())) {
            throw new IllegalStateException("EMAIL_TOKEN_PROTECTION_KEY is required when email delivery is enabled");
        }
        if (verificationExpiry.isNegative() || verificationExpiry.isZero()
                || passwordResetExpiry.isNegative() || passwordResetExpiry.isZero()) {
            throw new IllegalStateException("Email token expiry durations must be positive");
        }
        if (outbox.batchSize() < 1 || outbox.maxAttempts() < 1 || rateLimit.maxEntries() < 100) {
            throw new IllegalStateException("Email outbox and rate-limit bounds must be positive");
        }
    }

    public String publicBaseUrl() {
        return publicUrl.endsWith("/") ? publicUrl.substring(0, publicUrl.length() - 1) : publicUrl;
    }
}
