package com.hiliving.commerce.payment;

public enum PaymentAttemptStatus {
    CREATED,
    AWAITING_PAYMENT,
    PAID,
    FAILED,
    EXPIRED,
    CANCELLED,
    REFUNDED,
    RECONCILIATION_REQUIRED
}
