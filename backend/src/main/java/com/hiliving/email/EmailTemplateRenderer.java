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
    static final String LOGO_CONTENT_ID = "hiliving-logo";
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
                        + fallbackLink(url)
                        + notice("Энэ холбоос <strong>" + e(DATE_TIME.format(expiresAt)) + "</strong> хүртэл хүчинтэй.")
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
                        + fallbackLink(url)
                        + notice("Энэ холбоос <strong>" + e(DATE_TIME.format(expiresAt)) + "</strong> хүртэл хүчинтэй. "
                        + "Хэрэв та хүсэлт гаргаагүй бол энэ захидлыг үл тоомсорлоно уу.")
                        + supportHtml()));
    }

    public EmailContent passwordResetConfirmation(String firstName) {
        String subject = "HiLiving нууц үг шинэчлэгдлээ";
        String body = "Сайн байна уу, " + text(firstName) + ".\n\nТаны HiLiving бүртгэлийн нууц үг амжилттай шинэчлэгдлээ. Бүх өмнөх нэвтэрсэн сешн хүчингүй болсон.\n\n"
                + "Хэрэв та энэ өөрчлөлтийг хийгээгүй бол " + properties.supportAddress() + " хаягаар яаралтай холбогдоно уу.";
        return new EmailContent(subject, body, layout(subject,
                paragraph("Сайн байна уу, " + e(firstName) + ".")
                        + paragraph("Таны HiLiving бүртгэлийн нууц үг амжилттай шинэчлэгдэж, бүх өмнөх нэвтэрсэн сешн хүчингүй боллоо.")
                        + notice("Хэрэв та энэ өөрчлөлтийг хийгээгүй бол <a href=\"mailto:" + e(properties.supportAddress())
                        + "\" style=\"color:#e8423c\">" + e(properties.supportAddress())
                        + "</a> хаягаар яаралтай холбогдоно уу.")));
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
            rows.append("<tr><td style=\"padding:12px;border-bottom:1px solid #e8eaed;color:#30343b\">").append(e(item.productName()))
                    .append("<br><span style=\"font-size:12px;color:#7b818b\">").append(e(item.sku())).append("</span></td>"
                            + "<td style=\"padding:12px;text-align:center;border-bottom:1px solid #e8eaed;color:#30343b\">")
                    .append(item.quantity()).append("</td><td style=\"padding:12px;text-align:right;border-bottom:1px solid #e8eaed;color:#30343b;white-space:nowrap\">")
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
                + "<table role=\"presentation\" style=\"width:100%;border-collapse:collapse;margin:24px 0;border:1px solid #e8eaed\">"
                + "<thead><tr style=\"background:#f7f7f8\"><th style=\"text-align:left;padding:12px;color:#5f6670;font-size:12px\">БАРАА</th>"
                + "<th style=\"padding:12px;color:#5f6670;font-size:12px\">ТОО</th>"
                + "<th style=\"text-align:right;padding:12px;color:#5f6670;font-size:12px\">ДҮН</th></tr></thead><tbody>" + rows + "</tbody></table>"
                + totals(order)
                + paragraph("Хүлээн авагч: " + e(address.recipientName()) + " — " + e(address.recipientPhone())
                + "<br>Хаяг: " + e(address.cityOrProvince()) + ", " + e(address.districtOrSoum()) + ", " + e(address.addressLine()))
                + supportHtml();
        return new EmailContent(subject, plain.toString(), layout(subject, html));
    }

    private String layout(String heading, String content) {
        String publicUrl = e(properties.publicBaseUrl());
        return "<!doctype html><html lang=\"mn\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head>"
                + "<body style=\"margin:0;padding:0;background:#f4f5f7;font-family:Arial,sans-serif;color:#30343b\">"
                + "<div style=\"display:none;max-height:0;overflow:hidden;opacity:0;color:transparent\">" + e(heading) + "</div>"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"width:100%;background:#f4f5f7\">"
                + "<tr><td align=\"center\" style=\"padding:32px 16px\">"
                + "<table role=\"presentation\" width=\"600\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"width:100%;max-width:600px\">"
                + "<tr><td style=\"padding:0 4px 20px\"><a href=\"" + publicUrl + "\" style=\"text-decoration:none\">"
                + "<img src=\"cid:" + LOGO_CONTENT_ID + "\" width=\"184\" alt=\"HiLiving\" style=\"display:block;width:184px;max-width:100%;height:auto;border:0\"></a></td></tr>"
                + "<tr><td style=\"background:#ffffff;border:1px solid #e3e5e8;border-radius:16px;padding:36px 40px\">"
                + "<h1 style=\"margin:0 0 22px;font-size:24px;line-height:1.35;color:#25282d;font-weight:700\">" + e(heading) + "</h1>"
                + content + "</td></tr>"
                + "<tr><td align=\"center\" style=\"padding:22px 20px 0;color:#858b94;font-size:12px;line-height:1.6\">"
                + "Энэ захидлыг HiLiving систем автоматаар илгээлээ.<br>"
                + "<a href=\"" + publicUrl + "\" style=\"color:#666d77;text-decoration:underline\">HiLiving дэлгүүрт зочлох</a>"
                + "</td></tr></table></td></tr></table></body></html>";
    }

    private String paragraph(String value) { return "<p style=\"font-size:15px;line-height:1.7;color:#454b54;margin:16px 0\">" + value + "</p>"; }
    private String button(String label, String url) {
        return "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"margin:28px 0\"><tr>"
                + "<td bgcolor=\"#f7554e\" style=\"border-radius:8px\"><a href=\"" + e(url) + "\" "
                + "style=\"display:inline-block;background:#f7554e;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 22px;border-radius:8px\">"
                + e(label) + "</a></td></tr></table>";
    }
    private String fallbackLink(String url) {
        return "<p style=\"font-size:12px;line-height:1.6;color:#858b94;margin:0 0 24px\">Товч ажиллахгүй бол энэ холбоосыг хуулж нээнэ үү:<br>"
                + "<a href=\"" + e(url) + "\" style=\"color:#666d77;word-break:break-all\">" + e(url) + "</a></p>";
    }
    private String notice(String value) {
        return "<div style=\"margin:22px 0;padding:14px 16px;background:#fff4f3;border-left:4px solid #f7554e;border-radius:6px;"
                + "font-size:13px;line-height:1.65;color:#535963\">" + value + "</div>";
    }
    private String totals(EmailPayloads.Order order) {
        return "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" "
                + "style=\"width:100%;margin:0 0 24px;background:#f7f7f8;border-radius:8px\">"
                + totalRow("Үндсэн дүн", money(order.regularSubtotal(), order.currency()), false)
                + totalRow("Хөнгөлөлт", money(order.discountTotal(), order.currency()), false)
                + totalRow("Хүргэлт", money(order.shippingTotal(), order.currency()), false)
                + totalRow("Нийт", money(order.grandTotal(), order.currency()), true) + "</table>";
    }
    private String totalRow(String label, String amount, boolean emphasized) {
        String weight = emphasized ? "font-weight:700;color:#25282d" : "color:#5f6670";
        return "<tr><td style=\"padding:10px 14px;font-size:14px;" + weight + "\">" + e(label) + "</td>"
                + "<td align=\"right\" style=\"padding:10px 14px;font-size:14px;white-space:nowrap;" + weight + "\">" + e(amount) + "</td></tr>";
    }
    private String supportHtml() {
        return "<p style=\"font-size:13px;line-height:1.65;color:#6e747e;margin:26px 0 0;padding-top:20px;border-top:1px solid #eceef0\">"
                + "Тусламж хэрэгтэй бол <a href=\"mailto:" + e(properties.supportAddress()) + "\" style=\"color:#e8423c\">"
                + e(properties.supportAddress()) + "</a> хаягаар холбогдоно уу.</p>";
    }
    private String supportText() { return "Тусламж: " + text(properties.supportAddress()); }
    private String money(BigDecimal value, String currency) { return value.setScale(2, RoundingMode.HALF_UP).toPlainString() + " " + text(currency); }
    private String e(String value) { return HtmlUtils.htmlEscape(text(value)); }
    private String text(String value) { return value == null ? "" : value.replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "").replace('\r', ' '); }
}
