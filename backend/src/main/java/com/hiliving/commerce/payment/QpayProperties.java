package com.hiliving.commerce.payment;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties("hiliving.qpay")
public record QpayProperties(
        boolean enabled,
        String baseUrl,
        String clientId,
        String clientSecret,
        String invoiceCode,
        String callbackBaseUrl,
        Duration invoiceTtl,
        Duration connectTimeout,
        Duration readTimeout
) {
}
