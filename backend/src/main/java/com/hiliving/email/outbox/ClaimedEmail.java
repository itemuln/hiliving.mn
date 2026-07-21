package com.hiliving.email.outbox;

import com.hiliving.email.EmailEventType;

public record ClaimedEmail(
        Long id,
        EmailEventType eventType,
        String recipient,
        String payload,
        int attemptCount
) {
    static ClaimedEmail from(EmailOutboxEntity entity) {
        return new ClaimedEmail(entity.getId(), entity.getEventType(), entity.getRecipient(), entity.getPayload(), entity.getAttemptCount());
    }
}
