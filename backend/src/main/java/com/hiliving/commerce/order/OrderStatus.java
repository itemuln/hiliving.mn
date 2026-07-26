package com.hiliving.commerce.order;

public enum OrderStatus {
    PENDING_PAYMENT,
    PENDING_CONFIRMATION,
    CONFIRMED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED
}
