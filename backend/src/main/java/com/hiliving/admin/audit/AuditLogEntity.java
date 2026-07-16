package com.hiliving.admin.audit;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "admin_audit_log")
public class AuditLogEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "actor_email", nullable = false, length = 254) private String actorEmail;
    @Column(nullable = false, length = 80) private String action;
    @Column(name = "entity_type", nullable = false, length = 40) private String entityType;
    @Column(name = "entity_id") private Long entityId;
    @Column(length = 1000) private String details;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;

    protected AuditLogEntity() {}
    public AuditLogEntity(String actorEmail, String action, String entityType, Long entityId, String details) {
        this.actorEmail = actorEmail; this.action = action; this.entityType = entityType;
        this.entityId = entityId; this.details = details;
    }
    @PrePersist void create() { createdAt = Instant.now(); }
}
