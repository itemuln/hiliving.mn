package com.hiliving.email;

import com.hiliving.TestcontainersConfiguration;
import com.hiliving.email.outbox.EmailOutboxClaimService;
import com.hiliving.email.outbox.EmailOutboxProcessor;
import com.hiliving.email.outbox.EmailOutboxRepository;
import com.hiliving.email.outbox.EmailOutboxService;
import com.hiliving.email.outbox.EmailOutboxStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.MailParseException;
import org.springframework.mail.MailSendException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class EmailOutboxIntegrationTests {
    @Autowired EmailOutboxService outbox;
    @Autowired EmailOutboxRepository emails;
    @Autowired EmailOutboxProcessor processor;
    @Autowired EmailOutboxClaimService claims;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean TransactionalEmailService sender;

    @BeforeEach
    void clean() {
        jdbc.execute("TRUNCATE TABLE email_outbox RESTART IDENTITY");
        reset(sender);
    }

    @Test
    void successfulSendMarksSentAndDuplicateEventKeyIsIgnored() {
        assertThat(enqueue("success-1")).isTrue();
        assertThat(enqueue("success-1")).isFalse();
        assertThat(emails.count()).isOne();

        assertThat(processor.processAvailable()).isOne();
        var email = emails.findAll().getFirst();
        assertThat(email.getStatus()).isEqualTo(EmailOutboxStatus.SENT);
        assertThat(email.getAttemptCount()).isOne();
        assertThat(email.getProcessedAt()).isNotNull();
        verify(sender).sendPasswordResetConfirmation("customer@example.com", "Customer");
    }

    @Test
    void retryableFailureSchedulesRetryWithoutPersistingProviderDetailsThenSucceeds() {
        enqueue("retry-1");
        doThrow(new MailSendException("smtp secret host details")).when(sender)
                .sendPasswordResetConfirmation(anyString(), anyString());
        processor.processAvailable();
        var failedAttempt = emails.findAll().getFirst();
        assertThat(failedAttempt.getStatus()).isEqualTo(EmailOutboxStatus.PENDING);
        assertThat(failedAttempt.getAttemptCount()).isOne();
        assertThat(failedAttempt.getLastError()).doesNotContain("secret", "host details");

        reset(sender);
        jdbc.update("UPDATE email_outbox SET next_attempt_at = CURRENT_TIMESTAMP WHERE id = ?", failedAttempt.getId());
        processor.processAvailable();
        assertThat(emails.findById(failedAttempt.getId()).orElseThrow().getStatus()).isEqualTo(EmailOutboxStatus.SENT);
    }

    @Test
    void permanentFailureDoesNotBlockLaterEmail() {
        enqueue("permanent-1");
        doThrow(new MailParseException("bad recipient with internal detail")).when(sender)
                .sendPasswordResetConfirmation(anyString(), anyString());
        processor.processAvailable();
        assertThat(emails.findAll().getFirst().getStatus()).isEqualTo(EmailOutboxStatus.FAILED);

        reset(sender);
        enqueue("later-1");
        processor.processAvailable();
        assertThat(emails.findAll().stream().filter(email -> email.getStatus() == EmailOutboxStatus.SENT)).hasSize(1);
    }

    @Test
    void retryableFailureStopsAtConfiguredMaximumAttempts() {
        enqueue("bounded-1");
        doThrow(new MailSendException("temporary outage")).when(sender)
                .sendPasswordResetConfirmation(anyString(), anyString());
        for (int attempt = 0; attempt < 5; attempt++) {
            processor.processAvailable();
            jdbc.update("UPDATE email_outbox SET next_attempt_at = CURRENT_TIMESTAMP WHERE status = 'PENDING'");
        }
        var email = emails.findAll().getFirst();
        assertThat(email.getAttemptCount()).isEqualTo(5);
        assertThat(email.getStatus()).isEqualTo(EmailOutboxStatus.FAILED);
    }

    @Test
    void concurrentClaimersCannotClaimSameEmail() throws Exception {
        enqueue("concurrent-1");
        var start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            Future<Integer> first = executor.submit(() -> { start.await(); return claims.claimBatch().size(); });
            Future<Integer> second = executor.submit(() -> { start.await(); return claims.claimBatch().size(); });
            start.countDown();
            assertThat(first.get() + second.get()).isOne();
        }
        assertThat(emails.findAll().getFirst().getAttemptCount()).isOne();
    }

    @Test
    void payloadDoesNotContainPlainPasswordOrRawToken() {
        enqueue("sensitive-1");
        String payload = emails.findAll().getFirst().getPayload();
        assertThat(payload).doesNotContain("password", "token", "StrongPass123");
    }

    private boolean enqueue(String key) {
        return outbox.enqueue(key, EmailEventType.PASSWORD_RESET_CONFIRMATION, "customer@example.com",
                "HiLiving нууц үг шинэчлэгдлээ", "password-reset-confirmation",
                new EmailPayloads.PasswordResetConfirmation("Customer"));
    }
}
