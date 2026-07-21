package com.hiliving.identity.user.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(name = "phone_number", nullable = false, unique = true, length = 16)
    private String phoneNumber;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "membership_tier_id", nullable = false)
    private MembershipTierEntity membershipTier;

    @Column(name = "discount_override_percentage", precision = 5, scale = 2)
    private BigDecimal discountOverridePercentage;

    @Column(name = "email_verified_at")
    private Instant emailVerifiedAt;

    @Column(name = "session_version", nullable = false)
    private int sessionVersion;

    @Column(name = "phone_verified", nullable = false)
    private boolean phoneVerified;

    @Column(name = "failed_login_attempts", nullable = false)
    private int failedLoginAttempts;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected UserEntity() {
    }

    public static UserEntity customer(
            String firstName,
            String lastName,
            String email,
            String phoneNumber,
            String passwordHash,
            MembershipTierEntity membershipTier
    ) {
        UserEntity user = new UserEntity();
        user.firstName = firstName;
        user.lastName = lastName;
        user.email = email;
        user.phoneNumber = phoneNumber;
        user.passwordHash = passwordHash;
        user.role = UserRole.CUSTOMER;
        user.status = UserStatus.ACTIVE;
        user.membershipTier = membershipTier;
        return user;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public void registerFailedLogin(Instant now, int threshold, long lockSeconds) {
        failedLoginAttempts += 1;
        if (failedLoginAttempts >= threshold) lockedUntil = now.plusSeconds(lockSeconds);
    }

    public void recordSuccessfulLogin(Instant now) {
        failedLoginAttempts = 0;
        lockedUntil = null;
        lastLoginAt = now;
    }

    public void updateProfile(String firstName, String lastName, String email, String phoneNumber) {
        if (!this.email.equals(email)) this.emailVerifiedAt = null;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phoneNumber = phoneNumber;
    }

    public void changePassword(String passwordHash) { this.passwordHash = passwordHash; }
    public void verifyEmail(Instant verifiedAt) { this.emailVerifiedAt = verifiedAt; }
    public void invalidateSessions() { this.sessionVersion += 1; }
    public void changeStatus(UserStatus status) { this.status = status; }
    public void changeMembership(MembershipTierEntity membershipTier) { this.membershipTier = membershipTier; }
    public void changeDiscountOverride(BigDecimal discount) { this.discountOverridePercentage = discount; }

    public boolean isTemporarilyLocked(Instant now) {
        return lockedUntil != null && lockedUntil.isAfter(now);
    }

    public BigDecimal effectiveDiscountPercentage() {
        return discountOverridePercentage != null
                ? discountOverridePercentage
                : membershipTier.getDefaultDiscountPercentage();
    }

    public Long getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getPasswordHash() { return passwordHash; }
    public UserRole getRole() { return role; }
    public UserStatus getStatus() { return status; }
    public MembershipTierEntity getMembershipTier() { return membershipTier; }
    public BigDecimal getDiscountOverridePercentage() { return discountOverridePercentage; }
    public boolean isEmailVerified() { return emailVerifiedAt != null; }
    public Instant getEmailVerifiedAt() { return emailVerifiedAt; }
    public int getSessionVersion() { return sessionVersion; }
    public boolean isPhoneVerified() { return phoneVerified; }
    public int getFailedLoginAttempts() { return failedLoginAttempts; }
    public Instant getLockedUntil() { return lockedUntil; }
    public Instant getLastLoginAt() { return lastLoginAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
