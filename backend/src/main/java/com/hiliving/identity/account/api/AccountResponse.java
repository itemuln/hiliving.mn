package com.hiliving.identity.account.api;

import com.hiliving.identity.user.persistence.UserEntity;

import java.time.Instant;

public record AccountResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phoneNumber,
        String role,
        String status,
        boolean emailVerified,
        Instant emailVerifiedAt,
        boolean phoneVerified,
        MembershipResponse membership,
        Instant createdAt,
        Instant updatedAt
) {
    public static AccountResponse from(UserEntity user) {
        return new AccountResponse(
                user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getPhoneNumber(),
                user.getRole().name(), user.getStatus().name(), user.isEmailVerified(), user.getEmailVerifiedAt(), user.isPhoneVerified(),
                new MembershipResponse(
                        user.getMembershipTier().getCode(),
                        user.getMembershipTier().getDisplayName(),
                        user.getMembershipTier().getDefaultDiscountPercentage(),
                        user.getDiscountOverridePercentage(),
                        user.effectiveDiscountPercentage()
                ),
                user.getCreatedAt(), user.getUpdatedAt()
        );
    }
}
