package com.hiliving.email;

import java.time.Instant;

public interface TransactionalEmailService {
    void sendEmailVerification(String recipient, String firstName, String verificationUrl, Instant expiresAt);
    void sendPasswordReset(String recipient, String firstName, String resetUrl, Instant expiresAt);
    void sendPasswordResetConfirmation(String recipient, String firstName);
    void sendOrderConfirmation(String recipient, EmailPayloads.Order order);
    void sendOrderStatusChanged(String recipient, EmailPayloads.Order order);
}
