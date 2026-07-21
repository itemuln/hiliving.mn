package com.hiliving.email.outbox;

import tools.jackson.core.JacksonException;
import com.hiliving.email.EmailProperties;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailParseException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class EmailOutboxProcessor {
    private final EmailProperties properties;
    private final EmailOutboxClaimService claims;
    private final OutboxEmailDispatcher dispatcher;
    private final EmailOutboxResultService results;

    public EmailOutboxProcessor(EmailProperties properties, EmailOutboxClaimService claims,
                                OutboxEmailDispatcher dispatcher, EmailOutboxResultService results) {
        this.properties = properties;
        this.claims = claims;
        this.dispatcher = dispatcher;
        this.results = results;
    }

    @Scheduled(fixedDelayString = "${hiliving.email.outbox.polling-interval:10s}")
    public void poll() {
        if (properties.deliveryEnabled()) processAvailable();
    }

    public int processAvailable() {
        var batch = claims.claimBatch();
        for (ClaimedEmail email : batch) {
            try {
                dispatcher.dispatch(email);
                results.markSent(email.id(), email.attemptCount());
            } catch (RuntimeException exception) {
                results.markFailure(email.id(), email.attemptCount(), isPermanent(exception), safeError(exception));
            }
        }
        return batch.size();
    }

    private boolean isPermanent(Exception exception) {
        return exception instanceof MailParseException || exception instanceof MailAuthenticationException
                || exception instanceof JacksonException
                || exception.getMessage() != null && exception.getMessage().startsWith("Unable to read protected email token");
    }

    private String safeError(Exception exception) {
        if (exception instanceof MailAuthenticationException) return "SMTP authentication was rejected";
        if (exception instanceof MailParseException) return "Email address or message format was rejected";
        if (exception instanceof JacksonException) return "Stored email template payload is invalid";
        if (exception.getMessage() != null && exception.getMessage().startsWith("Unable to read protected email token")) {
            return "Protected email token could not be decrypted";
        }
        return "Email provider delivery attempt failed (" + exception.getClass().getSimpleName() + ")";
    }
}
