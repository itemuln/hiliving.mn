package com.hiliving.identity.account.api;

import java.math.BigDecimal;

public record MembershipResponse(
        String code,
        String displayName,
        BigDecimal defaultDiscountPercentage,
        BigDecimal discountOverridePercentage,
        BigDecimal effectiveDiscountPercentage
) {}
