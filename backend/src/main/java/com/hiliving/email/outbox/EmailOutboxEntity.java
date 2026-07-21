package com.hiliving.email.outbox;

import com.hiliving.email.EmailEventType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "email_outbox")
public class EmailOutboxEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "event_id", nullable = false, unique = true) private UUID eventId;
    @Enumerated(EnumType.STRING) @Column(name = "event_type", nullable = false, length = 50) private EmailEventType eventType;
    @Column(nullable = false, length = 254) private String recipient;
    @Column(nullable = false, length = 255) private String subject;
    @Column(name = "template_name", nullable = false, length = 80) private String templateName;
    @JdbcTypeCode(SqlTypes.JSON) @Column(nullable = false, columnDefinition = "jsonb") private String payload;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private EmailOutboxStatus status;
    @Column(name = "attempt_count", nullable = false) private int attemptCount;
    @Column(name = "next_attempt_at", nullable = false) private Instant nextAttemptAt;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "processed_at") private Instant processedAt;
    @Column(name = "last_error", length = 500) private String lastError;

    protected EmailOutboxEntity() {}

    void claim(Instant leaseUntil) {
        status = EmailOutboxStatus.PROCESSING;
        attemptCount += 1;
        nextAttemptAt = leaseUntil;
        lastError = null;
    }

    void sent(Instant now) {
        status = EmailOutboxStatus.SENT;
        processedAt = now;
        lastError = null;
    }

    void retry(Instant nextAttempt, String error) {
        status = EmailOutboxStatus.PENDING;
        nextAttemptAt = nextAttempt;
        lastError = error;
    }

    void failed(String error) {
        status = EmailOutboxStatus.FAILED;
        lastError = error;
    }

    public Long getId() { return id; }
    public UUID getEventId() { return eventId; }
    public EmailEventType getEventType() { return eventType; }
    public String getRecipient() { return recipient; }
    public String getSubject() { return subject; }
    public String getTemplateName() { return templateName; }
    public String getPayload() { return payload; }
    public EmailOutboxStatus getStatus() { return status; }
    public int getAttemptCount() { return attemptCount; }
    public Instant getNextAttemptAt() { return nextAttemptAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getProcessedAt() { return processedAt; }
    public String getLastError() { return lastError; }
}
