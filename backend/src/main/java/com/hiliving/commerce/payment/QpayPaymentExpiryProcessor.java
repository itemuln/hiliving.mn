package com.hiliving.commerce.payment;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

@Component
public class QpayPaymentExpiryProcessor {
    private static final Logger log = LoggerFactory.getLogger(QpayPaymentExpiryProcessor.class);
    private final QpayClient qpay;
    private final PaymentAttemptRepository attempts;
    private final PaymentStateService state;
    private final Clock clock;

    public QpayPaymentExpiryProcessor(QpayClient qpay, PaymentAttemptRepository attempts,
                                      PaymentStateService state, Clock clock) {
        this.qpay = qpay;
        this.attempts = attempts;
        this.state = state;
        this.clock = clock;
    }

    @Scheduled(fixedDelayString = "${hiliving.qpay.expiry-polling-interval:1m}")
    public void poll() {
        if (!qpay.configured()) return;
        var candidates = attempts.findTop50ByStatusInAndExpiresAtLessThanEqualOrderByExpiresAtAscIdAsc(
                List.of(PaymentAttemptStatus.CREATED, PaymentAttemptStatus.AWAITING_PAYMENT), Instant.now(clock)
        );
        for (PaymentAttemptEntity attempt : candidates) {
            if (attempt.getProviderInvoiceId() == null) continue;
            try {
                qpay.cancelInvoice(attempt.getProviderInvoiceId());
                state.expire(attempt.getId());
            } catch (RuntimeException exception) {
                log.warn("QPay invoice cancellation failed for payment attempt {}; inventory remains held",
                        attempt.getId(), exception);
            }
        }
    }
}
