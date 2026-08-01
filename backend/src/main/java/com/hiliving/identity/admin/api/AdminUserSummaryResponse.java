package com.hiliving.identity.admin.api;

import com.hiliving.identity.account.api.MembershipResponse;
import com.hiliving.identity.user.persistence.UserEntity;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminUserSummaryResponse(
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
        Instant updatedAt,
        long orderCount,
        BigDecimal totalPaid
) {
    public static AdminUserSummaryResponse from(UserEntity user, long orderCount, BigDecimal totalPaid) {
        return new AdminUserSummaryResponse(
                user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getPhoneNumber(),
                user.getRole().name(), user.getStatus().name(), user.isEmailVerified(), user.getEmailVerifiedAt(),
                user.isPhoneVerified(),
                new MembershipResponse(
                        user.getMembershipTier().getCode(),
                        user.getMembershipTier().getDisplayName(),
                        user.getMembershipTier().getDefaultDiscountPercentage(),
                        user.getDiscountOverridePercentage(),
                        user.effectiveDiscountPercentage()
                ),
                user.getCreatedAt(), user.getUpdatedAt(), orderCount, totalPaid
        );
    }
}
