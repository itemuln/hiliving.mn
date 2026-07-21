package com.hiliving.email.outbox;

public enum EmailOutboxStatus {
    PENDING,
    PROCESSING,
    SENT,
    FAILED
}
