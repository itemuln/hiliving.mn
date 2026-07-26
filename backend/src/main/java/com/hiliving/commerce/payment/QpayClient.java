package com.hiliving.commerce.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.net.URI;
import java.util.Locale;

@Component
public class QpayClient {
    private final QpayProperties properties;
    private final RestClient client;
    private final Clock clock;
    private TokenResponse tokens;

    public QpayClient(QpayProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(properties.connectTimeout());
        requestFactory.setReadTimeout(properties.readTimeout());
        this.client = RestClient.builder().baseUrl(properties.baseUrl()).requestFactory(requestFactory).build();
    }

    public InvoiceResponse createInvoice(InvoiceRequest request) {
        requireConfigured();
        try {
            InvoiceResponse response = client.post().uri("/v2/invoice")
                    .headers(headers -> headers.setBearerAuth(accessToken()))
                    .body(request)
                    .retrieve().body(InvoiceResponse.class);
            if (response == null || blank(response.invoiceId()) || blank(response.qrText())
                    || blank(response.qrImage()) || blank(response.shortUrl()) || response.urls() == null) {
                throw new QpayProviderException("QPAY_RESPONSE_INVALID", "QPay invoice response is incomplete");
            }
            requireHttps(response.shortUrl(), "QPay short URL");
            for (Deeplink deeplink : response.urls()) {
                if (deeplink == null || blank(deeplink.name()) || blank(deeplink.description())
                        || blank(deeplink.logo()) || blank(deeplink.link())) {
                    throw new QpayProviderException("QPAY_RESPONSE_INVALID", "QPay deeplink response is incomplete");
                }
                requireHttps(deeplink.logo(), "QPay bank logo URL");
                requireSafeDeeplink(deeplink.link());
            }
            return response;
        } catch (QpayProviderException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new QpayProviderException("QPAY_INVOICE_UNAVAILABLE", "QPay invoice creation failed", exception);
        }
    }

    public PaymentCheckResponse checkPayment(String invoiceId) {
        requireConfigured();
        try {
            PaymentCheckResponse response = client.post().uri("/v2/payment/check")
                    .headers(headers -> headers.setBearerAuth(accessToken()))
                    .body(new PaymentCheckRequest("INVOICE", invoiceId, new Offset(1, 100)))
                    .retrieve().body(PaymentCheckResponse.class);
            if (response == null || response.rows() == null) {
                throw new QpayProviderException("QPAY_RESPONSE_INVALID", "QPay payment response is incomplete");
            }
            return response;
        } catch (QpayProviderException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new QpayProviderException("QPAY_CHECK_UNAVAILABLE", "QPay payment verification failed", exception);
        }
    }

    public void cancelInvoice(String invoiceId) {
        requireConfigured();
        try {
            client.delete().uri("/v2/invoice/{invoiceId}", invoiceId)
                    .headers(headers -> headers.setBearerAuth(accessToken()))
                    .retrieve().toBodilessEntity();
        } catch (RestClientException exception) {
            throw new QpayProviderException("QPAY_CANCEL_UNAVAILABLE", "QPay invoice cancellation failed", exception);
        }
    }

    public boolean enabled() { return properties.enabled(); }
    public boolean configured() {
        return properties.enabled() && !blank(properties.baseUrl()) && !blank(properties.clientId())
                && !blank(properties.clientSecret()) && !blank(properties.invoiceCode())
                && !blank(properties.callbackBaseUrl());
    }
    public String invoiceCode() { return properties.invoiceCode(); }
    public String callbackBaseUrl() { return properties.callbackBaseUrl(); }
    public java.time.Duration invoiceTtl() { return properties.invoiceTtl(); }

    private synchronized String accessToken() {
        Instant now = Instant.now(clock);
        if (tokens != null && tokenExpiry(tokens.expiresIn(), now).isAfter(now.plusSeconds(60))) {
            return tokens.accessToken();
        }
        if (tokens != null && !blank(tokens.refreshToken())
                && tokenExpiry(tokens.refreshExpiresIn(), now).isAfter(now.plusSeconds(60))) {
            try {
                TokenResponse refreshed = client.post().uri("/v2/auth/refresh")
                        .headers(headers -> headers.setBearerAuth(tokens.refreshToken()))
                        .retrieve().body(TokenResponse.class);
                if (valid(refreshed)) {
                    tokens = refreshed;
                    return tokens.accessToken();
                }
            } catch (RestClientException ignored) {
                tokens = null;
            }
        }
        try {
            TokenResponse created = client.post().uri("/v2/auth/token")
                    .headers(headers -> headers.setBasicAuth(properties.clientId(), properties.clientSecret()))
                    .retrieve().body(TokenResponse.class);
            if (!valid(created)) {
                throw new QpayProviderException("QPAY_AUTH_INVALID", "QPay authentication response is incomplete");
            }
            tokens = created;
            return tokens.accessToken();
        } catch (QpayProviderException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new QpayProviderException("QPAY_AUTH_UNAVAILABLE", "QPay authentication failed", exception);
        }
    }

    private void requireConfigured() {
        if (!configured()) {
            throw new QpayProviderException("QPAY_NOT_CONFIGURED", "QPay is not configured");
        }
    }

    private boolean valid(TokenResponse response) {
        return response != null && !blank(response.accessToken()) && response.expiresIn() > 0;
    }

    private Instant tokenExpiry(long value, Instant now) {
        return value > now.getEpochSecond() + 86_400 ? Instant.ofEpochSecond(value) : now.plusSeconds(value);
    }

    private void requireHttps(String value, String label) {
        try {
            URI uri = URI.create(value);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) {
                throw invalidUrl(label);
            }
        } catch (IllegalArgumentException exception) {
            throw invalidUrl(label);
        }
    }

    private void requireSafeDeeplink(String value) {
        int separator = value.indexOf(':');
        if (separator < 1) throw invalidUrl("QPay bank deeplink");
        String scheme = value.substring(0, separator).toLowerCase(Locale.ROOT);
        if (!scheme.matches("[a-z][a-z0-9+.-]*")
                || scheme.equals("javascript") || scheme.equals("data")
                || scheme.equals("file") || scheme.equals("vbscript")) {
            throw invalidUrl("QPay bank deeplink");
        }
    }

    private QpayProviderException invalidUrl(String label) {
        return new QpayProviderException("QPAY_RESPONSE_INVALID", label + " is invalid");
    }

    private boolean blank(String value) { return value == null || value.isBlank(); }

    public record InvoiceRequest(
            @JsonProperty("invoice_code") String invoiceCode,
            @JsonProperty("sender_invoice_no") String senderInvoiceNo,
            @JsonProperty("invoice_receiver_code") String invoiceReceiverCode,
            @JsonProperty("invoice_description") String invoiceDescription,
            @JsonProperty("enable_expiry") boolean enableExpiry,
            @JsonProperty("allow_partial") boolean allowPartial,
            @JsonProperty("allow_exceed") boolean allowExceed,
            BigDecimal amount,
            @JsonProperty("callback_url") String callbackUrl
    ) {}

    public record InvoiceResponse(
            @JsonProperty("invoice_id") String invoiceId,
            @JsonProperty("qr_text") String qrText,
            @JsonProperty("qr_image") String qrImage,
            @JsonProperty("qPay_shortUrl") String shortUrl,
            @JsonProperty("urls") List<Deeplink> urls
    ) {}

    public record Deeplink(String name, String description, String logo, String link) {}

    public record PaymentCheckRequest(
            @JsonProperty("object_type") String objectType,
            @JsonProperty("object_id") String objectId,
            Offset offset
    ) {}

    public record Offset(
            @JsonProperty("page_number") int pageNumber,
            @JsonProperty("page_limit") int pageLimit
    ) {}

    public record PaymentCheckResponse(
            int count,
            @JsonProperty("paid_amount") BigDecimal paidAmount,
            List<PaymentRow> rows
    ) {}

    public record PaymentRow(
            @JsonProperty("payment_id") String paymentId,
            @JsonProperty("payment_status") String paymentStatus,
            @JsonProperty("payment_amount") BigDecimal paymentAmount,
            @JsonProperty("payment_currency") String paymentCurrency
    ) {}

    private record TokenResponse(
            @JsonProperty("access_token") String accessToken,
            @JsonProperty("refresh_token") String refreshToken,
            @JsonProperty("expires_in") long expiresIn,
            @JsonProperty("refresh_expires_in") long refreshExpiresIn
    ) {}
}
