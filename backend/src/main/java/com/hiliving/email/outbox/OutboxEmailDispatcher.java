package com.hiliving.email.outbox;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.hiliving.email.EmailPayloads;
import com.hiliving.email.EmailProperties;
import com.hiliving.email.TokenProtector;
import com.hiliving.email.TransactionalEmailService;
import org.springframework.stereotype.Component;

@Component
public class OutboxEmailDispatcher {
    private final ObjectMapper objectMapper;
    private final TokenProtector tokens;
    private final TransactionalEmailService emailService;
    private final EmailProperties properties;

    public OutboxEmailDispatcher(ObjectMapper objectMapper, TokenProtector tokens,
                                 TransactionalEmailService emailService, EmailProperties properties) {
        this.objectMapper = objectMapper;
        this.tokens = tokens;
        this.emailService = emailService;
        this.properties = properties;
    }

    public void dispatch(ClaimedEmail email) throws JacksonException {
        switch (email.eventType()) {
            case EMAIL_VERIFICATION -> {
                EmailPayloads.Verification payload = read(email, EmailPayloads.Verification.class);
                String rawToken = tokens.unprotect(payload.protectedToken());
                emailService.sendEmailVerification(email.recipient(), payload.firstName(),
                        properties.publicBaseUrl() + "/verify-email?token=" + rawToken, payload.expiresAt());
            }
            case PASSWORD_RESET -> {
                EmailPayloads.PasswordReset payload = read(email, EmailPayloads.PasswordReset.class);
                String rawToken = tokens.unprotect(payload.protectedToken());
                emailService.sendPasswordReset(email.recipient(), payload.firstName(),
                        properties.publicBaseUrl() + "/reset-password?token=" + rawToken, payload.expiresAt());
            }
            case PASSWORD_RESET_CONFIRMATION -> {
                EmailPayloads.PasswordResetConfirmation payload = read(email, EmailPayloads.PasswordResetConfirmation.class);
                emailService.sendPasswordResetConfirmation(email.recipient(), payload.firstName());
            }
            case ORDER_CONFIRMATION -> emailService.sendOrderConfirmation(email.recipient(), read(email, EmailPayloads.Order.class));
            case ORDER_STATUS_CHANGED -> emailService.sendOrderStatusChanged(email.recipient(), read(email, EmailPayloads.Order.class));
        }
    }

    private <T> T read(ClaimedEmail email, Class<T> type) throws JacksonException {
        return objectMapper.readValue(email.payload(), type);
    }
}
