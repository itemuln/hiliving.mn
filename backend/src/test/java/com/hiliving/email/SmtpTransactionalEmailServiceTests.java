package com.hiliving.email;

import jakarta.mail.BodyPart;
import jakarta.mail.Multipart;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.List;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SmtpTransactionalEmailServiceTests {
    @Test
    void sendsLogoAsInlinePngResource() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(message);
        EmailProperties properties = EmailTemplateRendererTests.properties(true);
        SmtpTransactionalEmailService service = new SmtpTransactionalEmailService(
                mailSender,
                properties,
                new EmailTemplateRenderer(properties)
        );

        service.sendPasswordResetConfirmation("customer@example.com", "Customer");
        message.saveChanges();

        verify(mailSender).send(message);
        assertThat(hasInlineLogo(message.getContent())).isTrue();
    }

    private boolean hasInlineLogo(Object content) throws Exception {
        if (!(content instanceof Multipart multipart)) return false;
        for (int index = 0; index < multipart.getCount(); index++) {
            BodyPart part = multipart.getBodyPart(index);
            String[] contentIds = part.getHeader("Content-ID");
            if (part.isMimeType("image/png") && contentIds != null
                    && List.of(contentIds).contains("<" + EmailTemplateRenderer.LOGO_CONTENT_ID + ">")) {
                return true;
            }
            if (part.isMimeType("multipart/*") && hasInlineLogo(part.getContent())) return true;
        }
        return false;
    }
}
