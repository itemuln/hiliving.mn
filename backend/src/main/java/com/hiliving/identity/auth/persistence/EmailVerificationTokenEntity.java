package com.hiliving.identity.auth.persistence;

import com.hiliving.identity.user.persistence.UserEntity;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "email_verification_tokens")
public class EmailVerificationTokenEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false) private UserEntity user;
    @Column(name = "token_hash", nullable = false, unique = true, length = 64) private String tokenHash;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "used_at") private Instant usedAt;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "requested_ip", length = 45) private String requestedIp;

    protected EmailVerificationTokenEntity() {}
    public EmailVerificationTokenEntity(UserEntity user, String tokenHash, Instant expiresAt, Instant createdAt, String requestedIp) {
        this.user = user; this.tokenHash = tokenHash; this.expiresAt = expiresAt; this.createdAt = createdAt; this.requestedIp = requestedIp;
    }
    public void consume(Instant now) { usedAt = now; }
    public Long getId() { return id; }
    public UserEntity getUser() { return user; }
    public String getTokenHash() { return tokenHash; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getUsedAt() { return usedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public String getRequestedIp() { return requestedIp; }
}
