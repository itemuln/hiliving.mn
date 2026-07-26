package com.hiliving.commerce.payment;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class QpayClientContractTests {
    private final ObjectMapper json = new ObjectMapper();

    @Test
    void simpleInvoiceRequestAndResponseMatchTheQpayV2Contract() throws Exception {
        QpayClient.InvoiceRequest request = new QpayClient.InvoiceRequest(
                "TEST_INVOICE", "HL20260725ABC123P1", "42", "HiLiving order HL20260725ABC123",
                true, false, false, new BigDecimal("14000.00"),
                "https://shop.example/api/v1/payments/qpay/callback/token"
        );

        JsonNode serialized = json.valueToTree(request);
        assertThat(serialized.get("invoice_code").asText()).isEqualTo("TEST_INVOICE");
        assertThat(serialized.get("sender_invoice_no").asText()).isEqualTo("HL20260725ABC123P1");
        assertThat(serialized.get("allow_partial").asBoolean()).isFalse();
        assertThat(serialized.get("allow_exceed").asBoolean()).isFalse();
        assertThat(serialized.get("callback_url").asText()).startsWith("https://shop.example/");

        QpayClient.InvoiceResponse response = json.readValue("""
                {
                  "invoice_id": "d50f49f2-9032-4a74-8929-530531f28f63",
                  "qr_text": "000201010212",
                  "qr_image": "cXItcG5n",
                  "qPay_shortUrl": "https://s.qpay.mn/test",
                  "urls": [{
                    "name": "Khan bank",
                    "description": "Хаан банк",
                    "logo": "https://qpay.mn/q/logo/khanbank.png",
                    "link": "khanbank://q?qPay_QRcode=000201010212"
                  }]
                }
                """, QpayClient.InvoiceResponse.class);

        assertThat(response.invoiceId()).isEqualTo("d50f49f2-9032-4a74-8929-530531f28f63");
        assertThat(response.shortUrl()).isEqualTo("https://s.qpay.mn/test");
        assertThat(response.urls()).singleElement().satisfies(deeplink -> {
            assertThat(deeplink.name()).isEqualTo("Khan bank");
            assertThat(deeplink.link()).startsWith("khanbank://");
        });
    }

    @Test
    void paymentCheckAcceptsQpayDecimalStringsWithoutLosingPrecision() throws Exception {
        QpayClient.PaymentCheckResponse response = json.readValue("""
                {
                  "count": 1,
                  "paid_amount": 14000,
                  "rows": [{
                    "payment_id": "493622150113497",
                    "payment_status": "PAID",
                    "payment_amount": "14000.00",
                    "payment_currency": "MNT"
                  }]
                }
                """, QpayClient.PaymentCheckResponse.class);

        assertThat(response.paidAmount()).isEqualByComparingTo("14000.00");
        assertThat(response.rows()).singleElement().satisfies(row -> {
            assertThat(row.paymentStatus()).isEqualTo("PAID");
            assertThat(row.paymentAmount()).isEqualByComparingTo("14000.00");
            assertThat(row.paymentCurrency()).isEqualTo("MNT");
        });
    }
}
