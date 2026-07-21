package com.hiliving.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.time.Instant;

@Service
public class SmtpTransactionalEmailService implements TransactionalEmailService {
    private final JavaMailSender mailSender;
    private final EmailProperties properties;
    private final EmailTemplateRenderer templates;

    public SmtpTransactionalEmailService(JavaMailSender mailSender, EmailProperties properties, EmailTemplateRenderer templates) {
        this.mailSender = mailSender;
        this.properties = properties;
        this.templates = templates;
    }

    @Override
    public void sendEmailVerification(String recipient, String firstName, String verificationUrl, Instant expiresAt) {
        send(recipient, templates.verification(firstName, verificationUrl, expiresAt));
    }

    @Override
    public void sendPasswordReset(String recipient, String firstName, String resetUrl, Instant expiresAt) {
        send(recipient, templates.passwordReset(firstName, resetUrl, expiresAt));
    }

    @Override
    public void sendPasswordResetConfirmation(String recipient, String firstName) {
        send(recipient, templates.passwordResetConfirmation(firstName));
    }

    @Override
    public void sendOrderConfirmation(String recipient, EmailPayloads.Order order) {
        send(recipient, templates.orderConfirmation(order));
    }

    @Override
    public void sendOrderStatusChanged(String recipient, EmailPayloads.Order order) {
        send(recipient, templates.orderStatusChanged(order));
    }

    public void sendManualConfigurationTest(String recipient) {
        if (!properties.deliveryEnabled() || !properties.manualTestEnabled()) {
            throw new IllegalStateException("Manual email test requires both delivery and manual test flags");
        }
        if (recipient == null || recipient.isBlank() || !recipient.equals(properties.testRecipient())) {
            throw new IllegalStateException("Manual email test recipient must come from EMAIL_TEST_RECIPIENT");
        }
        send(recipient, templates.configurationTest());
    }

    private void send(String recipient, EmailContent content) {
        if (!properties.deliveryEnabled()) throw new EmailDeliveryDisabledException();
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(new InternetAddress(properties.fromAddress(), properties.fromName()));
            helper.setTo(recipient);
            helper.setSubject(content.subject());
            helper.setText(content.textBody(), content.htmlBody());
            mailSender.send(message);
        } catch (MessagingException | UnsupportedEncodingException exception) {
            throw new IllegalStateException("Unable to construct transactional email", exception);
        }
    }
}
