package com.hiliving.email.outbox;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.hiliving.email.EmailEventType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

@Service
public class EmailOutboxService {
    private final EmailOutboxRepository emails;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public EmailOutboxService(EmailOutboxRepository emails, ObjectMapper objectMapper, Clock clock) {
        this.emails = emails;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    @Transactional
    public boolean enqueue(String idempotencyKey, EmailEventType type, String recipient,
                           String subject, String templateName, Object payload) {
        try {
            return emails.insertIfAbsent(
                    eventId(idempotencyKey), type.name(), recipient, subject, templateName,
                    objectMapper.writeValueAsString(payload), Instant.now(clock)
            ) == 1;
        } catch (JacksonException exception) {
            throw new IllegalStateException("Unable to serialize email event payload", exception);
        }
    }

    public static UUID eventId(String idempotencyKey) {
        return UUID.nameUUIDFromBytes(("hiliving-email-v1:" + idempotencyKey).getBytes(StandardCharsets.UTF_8));
    }
}
