package com.hiliving.commerce.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record PaymentInstructionsResponse(
        String provider,
        String status,
        BigDecimal amount,
        String currency,
        String qrText,
        String qrImageDataUrl,
        String shortUrl,
        Instant expiresAt,
        Instant paidAt,
        List<DeeplinkResponse> deeplinks
) {
    static PaymentInstructionsResponse from(PaymentAttemptEntity attempt) {
        String image = attempt.getQrImage() == null ? null : "data:image/png;base64," + attempt.getQrImage();
        return new PaymentInstructionsResponse(
                "QPAY", attempt.getStatus().name(), attempt.getAmount(), attempt.getCurrency(),
                attempt.getQrText(), image, attempt.getShortUrl(), attempt.getExpiresAt(), attempt.getPaidAt(),
                attempt.getDeeplinks().stream().map(DeeplinkResponse::from).toList()
        );
    }

    public record DeeplinkResponse(String name, String description, String logoUrl, String link) {
        static DeeplinkResponse from(PaymentDeeplinkEntity deeplink) {
            return new DeeplinkResponse(
                    deeplink.getName(), deeplink.getDescription(), deeplink.getLogoUrl(), deeplink.getLink()
            );
        }
    }
}
