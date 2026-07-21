package com.hiliving.email;

import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
public class EmailTemplateRenderer {
    private static final ZoneId DISPLAY_ZONE = ZoneId.of("Asia/Ulaanbaatar");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm z", Locale.ROOT)
            .withZone(DISPLAY_ZONE);

    private final EmailProperties properties;

    public EmailTemplateRenderer(EmailProperties properties) {
        this.properties = properties;
    }

    public EmailContent verification(String firstName, String url, Instant expiresAt) {
        String subject = "HiLiving имэйл хаягаа баталгаажуулна уу";
        String intro = "Сайн байна уу, " + text(firstName) + ".";
        String body = intro + "\n\nHiLiving бүртгэлийн имэйл хаягаа баталгаажуулахын тулд дараах холбоосыг нээнэ үү:\n"
                + url + "\n\nХолбоос " + DATE_TIME.format(expiresAt) + " хүртэл хүчинтэй.\n\n"
                + supportText();
        return new EmailContent(subject, body, layout(subject,
                paragraph("Сайн байна уу, " + e(firstName) + ".")
                        + paragraph("HiLiving бүртгэлийн имэйл хаягаа баталгаажуулна уу.")
                        + button("Имэйл баталгаажуулах", url)
                        + paragraph("Энэ холбоос <strong>" + e(DATE_TIME.format(expiresAt)) + "</strong> хүртэл хүчинтэй.")
                        + supportHtml()));
    }

    public EmailContent passwordReset(String firstName, String url, Instant expiresAt) {
        String subject = "HiLiving нууц үг сэргээх хүсэлт";
        String body = "Сайн байна уу, " + text(firstName) + ".\n\nНууц үгээ шинэчлэхийн тулд дараах холбоосыг нээнэ үү:\n"
                + url + "\n\nХолбоос " + DATE_TIME.format(expiresAt) + " хүртэл хүчинтэй. Хэрэв та хүсэлт гаргаагүй бол үл тоомсорлоно уу.\n\n"
                + supportText();
        return new EmailContent(subject, body, layout(subject,
                paragraph("Сайн байна уу, " + e(firstName) + ".")
                        + paragraph("HiLiving бүртгэлийн нууц үгээ шинэчлэх хүсэлт хүлээн авлаа.")
                        + button("Нууц үг шинэчлэх", url)
                        + paragraph("Энэ холбоос <strong>" + e(DATE_TIME.format(expiresAt)) + "</strong> хүртэл хүчинтэй. Хэрэв та хүсэлт гаргаагүй бол энэ захидлыг үл тоомсорлоно уу.")
                        + supportHtml()));
    }

    public EmailContent passwordResetConfirmation(String firstName) {
        String subject = "HiLiving нууц үг шинэчлэгдлээ";
        String body = "Сайн байна уу, " + text(firstName) + ".\n\nТаны HiLiving бүртгэлийн нууц үг амжилттай шинэчлэгдлээ. Бүх өмнөх нэвтэрсэн сешн хүчингүй болсон.\n\n"
                + "Хэрэв та энэ өөрчлөлтийг хийгээгүй бол " + properties.supportAddress() + " хаягаар яаралтай холбогдоно уу.";
        return new EmailContent(subject, body, layout(subject,
                paragraph("Сайн байна уу, " + e(firstName) + ".")
                        + paragraph("Таны HiLiving бүртгэлийн нууц үг амжилттай шинэчлэгдэж, бүх өмнөх нэвтэрсэн сешн хүчингүй боллоо.")
                        + paragraph("Хэрэв та энэ өөрчлөлтийг хийгээгүй бол <a href=\"mailto:" + e(properties.supportAddress()) + "\">"
                        + e(properties.supportAddress()) + "</a> хаягаар яаралтай холбогдоно уу.")));
    }

    public EmailContent configurationTest() {
        String subject = "[HiLiving Test] Transactional email configuration";
        String body = "This is a non-production HiLiving transactional email configuration test.\n\n"
                + "No customer action is required. Support configuration: " + supportText();
        return new EmailContent(subject, body, layout(subject,
                paragraph("This is a <strong>non-production</strong> HiLiving transactional email configuration test.")
                        + paragraph("No customer action is required.") + supportHtml()));
    }

    public EmailContent orderConfirmation(EmailPayloads.Order order) {
        return orderEmail("HiLiving захиалга баталгаажлаа — " + order.orderNumber(),
                "Таны захиалгыг хүлээн авлаа.", order);
    }

    public EmailContent orderStatusChanged(EmailPayloads.Order order) {
        return orderEmail("HiLiving захиалгын төлөв шинэчлэгдлээ — " + order.orderNumber(),
                "Захиалгын шинэ төлөв: " + order.status(), order);
    }

    private EmailContent orderEmail(String subject, String lead, EmailPayloads.Order order) {
        StringBuilder plain = new StringBuilder("Сайн байна уу, ").append(text(order.firstName())).append(".\n\n")
                .append(lead).append("\nЗахиалгын дугаар: ").append(text(order.orderNumber()))
                .append("\nОгноо: ").append(DATE_TIME.format(order.placedAt())).append("\n\nБараа:\n");
        StringBuilder rows = new StringBuilder();
        for (EmailPayloads.OrderItem item : order.items()) {
            plain.append("- ").append(text(item.productName())).append(" (").append(text(item.sku())).append(") × ")
                    .append(item.quantity()).append(" — ").append(money(item.lineTotal(), order.currency())).append('\n');
            rows.append("<tr><td style=\"padding:8px;border-bottom:1px solid #eee\">").append(e(item.productName()))
                    .append("<br><small>").append(e(item.sku())).append("</small></td><td style=\"padding:8px;text-align:center;border-bottom:1px solid #eee\">")
                    .append(item.quantity()).append("</td><td style=\"padding:8px;text-align:right;border-bottom:1px solid #eee\">")
                    .append(e(money(item.lineTotal(), order.currency()))).append("</td></tr>");
        }
        EmailPayloads.OrderAddress address = order.address();
        plain.append("\nҮндсэн дүн: ").append(money(order.regularSubtotal(), order.currency()))
                .append("\nХөнгөлөлт: ").append(money(order.discountTotal(), order.currency()))
                .append("\nХүргэлт: ").append(money(order.shippingTotal(), order.currency()))
                .append("\nНийт: ").append(money(order.grandTotal(), order.currency()))
                .append("\n\nХүлээн авагч: ").append(text(address.recipientName())).append(" — ").append(text(address.recipientPhone()))
                .append("\nХаяг: ").append(text(address.cityOrProvince())).append(", ").append(text(address.districtOrSoum()))
                .append(", ").append(text(address.addressLine())).append("\n\n").append(supportText());

        String html = paragraph("Сайн байна уу, " + e(order.firstName()) + ".") + paragraph(e(lead))
                + paragraph("Захиалгын дугаар: <strong>" + e(order.orderNumber()) + "</strong><br>Огноо: " + e(DATE_TIME.format(order.placedAt())))
                + "<table style=\"width:100%;border-collapse:collapse;margin:20px 0\"><thead><tr><th style=\"text-align:left;padding:8px\">Бараа</th><th>Тоо</th><th style=\"text-align:right\">Дүн</th></tr></thead><tbody>" + rows + "</tbody></table>"
                + paragraph("Үндсэн дүн: " + e(money(order.regularSubtotal(), order.currency()))
                + "<br>Хөнгөлөлт: " + e(money(order.discountTotal(), order.currency()))
                + "<br>Хүргэлт: " + e(money(order.shippingTotal(), order.currency()))
                + "<br><strong>Нийт: " + e(money(order.grandTotal(), order.currency())) + "</strong>")
                + paragraph("Хүлээн авагч: " + e(address.recipientName()) + " — " + e(address.recipientPhone())
                + "<br>Хаяг: " + e(address.cityOrProvince()) + ", " + e(address.districtOrSoum()) + ", " + e(address.addressLine()))
                + supportHtml();
        return new EmailContent(subject, plain.toString(), layout(subject, html));
    }

    private String layout(String heading, String content) {
        return "<!doctype html><html><body style=\"margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#262626\">"
                + "<div style=\"display:none;max-height:0;overflow:hidden\">" + e(heading) + "</div>"
                + "<main style=\"max-width:600px;margin:0 auto;padding:32px 20px\"><section style=\"background:#fff;border-radius:16px;padding:32px\">"
                + "<h1 style=\"font-size:24px;margin:0 0 24px;color:#138a4b\">HiLiving</h1>" + content
                + "</section></main></body></html>";
    }

    private String paragraph(String value) { return "<p style=\"line-height:1.65;margin:16px 0\">" + value + "</p>"; }
    private String button(String label, String url) {
        return "<p style=\"margin:28px 0\"><a href=\"" + e(url) + "\" style=\"display:inline-block;background:#138a4b;color:#fff;text-decoration:none;padding:13px 20px;border-radius:10px\">" + e(label) + "</a></p>";
    }
    private String supportHtml() { return paragraph("Тусламж хэрэгтэй бол <a href=\"mailto:" + e(properties.supportAddress()) + "\">" + e(properties.supportAddress()) + "</a> хаягаар холбогдоно уу."); }
    private String supportText() { return "Тусламж: " + text(properties.supportAddress()); }
    private String money(BigDecimal value, String currency) { return value.setScale(2, RoundingMode.HALF_UP).toPlainString() + " " + text(currency); }
    private String e(String value) { return HtmlUtils.htmlEscape(text(value)); }
    private String text(String value) { return value == null ? "" : value.replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "").replace('\r', ' '); }
}
