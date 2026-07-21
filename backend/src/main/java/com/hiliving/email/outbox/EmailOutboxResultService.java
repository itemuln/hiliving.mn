package com.hiliving.email.outbox;

import com.hiliving.email.EmailProperties;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

@Service
public class EmailOutboxResultService {
    private final EmailOutboxRepository emails;
    private final EmailProperties properties;
    private final Clock clock;

    public EmailOutboxResultService(EmailOutboxRepository emails, EmailProperties properties, Clock clock) {
        this.emails = emails;
        this.properties = properties;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markSent(Long id, int claimedAttempt) {
        EmailOutboxEntity email = lockedProcessing(id, claimedAttempt);
        if (email != null) email.sent(Instant.now(clock));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailure(Long id, int claimedAttempt, boolean permanent, String safeError) {
        EmailOutboxEntity email = lockedProcessing(id, claimedAttempt);
        if (email == null) return;
        if (permanent || email.getAttemptCount() >= properties.outbox().maxAttempts()) {
            email.failed(safeError);
            return;
        }
        long multiplier = 1L << Math.min(30, Math.max(0, email.getAttemptCount() - 1));
        Duration calculated = properties.outbox().initialRetryDelay().multipliedBy(multiplier);
        Duration delay = calculated.compareTo(properties.outbox().maxRetryDelay()) > 0
                ? properties.outbox().maxRetryDelay() : calculated;
        email.retry(Instant.now(clock).plus(delay), safeError);
    }

    private EmailOutboxEntity lockedProcessing(Long id, int claimedAttempt) {
        EmailOutboxEntity email = emails.findByIdForUpdate(id).orElse(null);
        if (email == null || email.getStatus() != EmailOutboxStatus.PROCESSING
                || email.getAttemptCount() != claimedAttempt) return null;
        return email;
    }
}
