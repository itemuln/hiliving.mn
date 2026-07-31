package com.hiliving.email;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EmailTemplateRendererTests {
    private final EmailTemplateRenderer renderer = new EmailTemplateRenderer(properties(false));

    @Test
    void verificationUsesBrandedAccessibleLayoutAndEscapesUserContent() {
        String url = "https://srv1869478.hstgr.cloud/verify-email?token=a&next=b";

        EmailContent content = renderer.verification("<Тэмүүлэн>", url, Instant.parse("2026-08-01T08:00:00Z"));

        assertThat(content.htmlBody())
                .contains("lang=\"mn\"")
                .contains("src=\"cid:hiliving-logo\"")
                .contains("alt=\"HiLiving\"")
                .contains("width=\"184\"")
                .contains("#f7554e")
                .contains("HiLiving имэйл хаягаа баталгаажуулна уу")
                .contains("&lt;Тэмүүлэн&gt;")
                .contains("token=a&amp;next=b")
                .doesNotContain("#138a4b", "<Тэмүүлэн>");
        assertThat(content.textBody()).contains(url, "Тусламж: support@hiliving.mn");
    }

    @Test
    void orderEmailUsesReadableItemAndTotalsSections() {
        EmailPayloads.Order order = new EmailPayloads.Order(
                "Тэмүүлэн",
                "HL-1001",
                Instant.parse("2026-07-31T08:00:00Z"),
                "PAID",
                "MNT",
                new BigDecimal("15000"),
                new BigDecimal("3000"),
                BigDecimal.ZERO,
                new BigDecimal("12000"),
                List.of(new EmailPayloads.OrderItem(
                        "HiLiving бүтээгдэхүүн",
                        "PRD-000001",
                        new BigDecimal("15000"),
                        new BigDecimal("12000"),
                        new BigDecimal("3000"),
                        1,
                        new BigDecimal("12000")
                )),
                new EmailPayloads.OrderAddress(
                        "Гэр",
                        "Улаанбаатар",
                        "Сүхбаатар",
                        "1-р хороо",
                        "Энхтайвны өргөн чөлөө 1",
                        "",
                        "Тэмүүлэн",
                        "99000000"
                )
        );

        EmailContent content = renderer.orderConfirmation(order);

        assertThat(content.htmlBody())
                .contains("src=\"cid:hiliving-logo\"")
                .contains("БАРАА", "ТОО", "ДҮН")
                .contains("PRD-000001")
                .contains("Үндсэн дүн", "Хөнгөлөлт", "Хүргэлт", "Нийт")
                .contains("12000.00 MNT");
        assertThat(content.textBody()).contains("HL-1001", "12000.00 MNT", "99000000");
    }

    static EmailProperties properties(boolean deliveryEnabled) {
        return new EmailProperties(
                deliveryEnabled,
                false,
                "",
                "hilivingmgl@gmail.com",
                "HiLiving",
                "support@hiliving.mn",
                "https://srv1869478.hstgr.cloud",
                "test-key",
                Duration.ofHours(24),
                Duration.ofMinutes(30),
                new EmailProperties.Outbox(20, 5, Duration.ofMinutes(1), Duration.ofHours(1), Duration.ofMinutes(10)),
                new EmailProperties.RateLimit(10000, 3, Duration.ofHours(1), 5, Duration.ofHours(1), 10, Duration.ofMinutes(15))
        );
    }
}
