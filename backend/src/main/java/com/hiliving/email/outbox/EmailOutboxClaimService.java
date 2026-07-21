package com.hiliving.email.outbox;

import com.hiliving.email.EmailProperties;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

@Service
public class EmailOutboxClaimService {
    private final EmailOutboxRepository emails;
    private final EmailProperties properties;
    private final Clock clock;

    public EmailOutboxClaimService(EmailOutboxRepository emails, EmailProperties properties, Clock clock) {
        this.emails = emails;
        this.properties = properties;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public List<ClaimedEmail> claimBatch() {
        Instant now = Instant.now(clock);
        List<EmailOutboxEntity> batch = emails.lockNextBatch(now, properties.outbox().batchSize());
        Instant leaseUntil = now.plus(properties.outbox().processingTimeout());
        batch.forEach(email -> email.claim(leaseUntil));
        emails.flush();
        return batch.stream().map(ClaimedEmail::from).toList();
    }
}
