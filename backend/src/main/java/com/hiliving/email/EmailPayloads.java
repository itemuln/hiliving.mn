package com.hiliving.email;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class EmailPayloads {
    private EmailPayloads() {}

    public record Verification(String firstName, String protectedToken, Instant expiresAt) {}
    public record PasswordReset(String firstName, String protectedToken, Instant expiresAt) {}
    public record PasswordResetConfirmation(String firstName) {}

    public record Order(
            String firstName,
            String orderNumber,
            Instant placedAt,
            String status,
            String currency,
            BigDecimal regularSubtotal,
            BigDecimal discountTotal,
            BigDecimal shippingTotal,
            BigDecimal grandTotal,
            List<OrderItem> items,
            OrderAddress address
    ) {}

    public record OrderItem(
            String productName,
            String sku,
            BigDecimal unitRegularPrice,
            BigDecimal unitEffectivePrice,
            BigDecimal discountPerUnit,
            int quantity,
            BigDecimal lineTotal
    ) {}

    public record OrderAddress(
            String label,
            String cityOrProvince,
            String districtOrSoum,
            String khorooOrBag,
            String addressLine,
            String additionalDetails,
            String recipientName,
            String recipientPhone
    ) {}
}
