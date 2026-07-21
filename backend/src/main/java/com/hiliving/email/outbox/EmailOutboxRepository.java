package com.hiliving.email.outbox;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmailOutboxRepository extends JpaRepository<EmailOutboxEntity, Long> {
    Optional<EmailOutboxEntity> findByEventId(UUID eventId);
    long countByEventId(UUID eventId);

    @Modifying
    @Query(value = """
            INSERT INTO email_outbox
                (event_id, event_type, recipient, subject, template_name, payload, status,
                 attempt_count, next_attempt_at, created_at)
            VALUES
                (:eventId, :eventType, :recipient, :subject, :templateName, CAST(:payload AS jsonb),
                 'PENDING', 0, :now, :now)
            ON CONFLICT (event_id) DO NOTHING
            """, nativeQuery = true)
    int insertIfAbsent(
            @Param("eventId") UUID eventId,
            @Param("eventType") String eventType,
            @Param("recipient") String recipient,
            @Param("subject") String subject,
            @Param("templateName") String templateName,
            @Param("payload") String payload,
            @Param("now") Instant now
    );

    @Query(value = """
            SELECT * FROM email_outbox
            WHERE status IN ('PENDING', 'PROCESSING') AND next_attempt_at <= :now
            ORDER BY next_attempt_at, id
            FOR UPDATE SKIP LOCKED
            LIMIT :batchSize
            """, nativeQuery = true)
    List<EmailOutboxEntity> lockNextBatch(@Param("now") Instant now, @Param("batchSize") int batchSize);

    @Query("select email from EmailOutboxEntity email where email.id = :id")
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    Optional<EmailOutboxEntity> findByIdForUpdate(@Param("id") Long id);
}
