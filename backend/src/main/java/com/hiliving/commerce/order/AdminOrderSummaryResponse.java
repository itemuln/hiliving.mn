package com.hiliving.commerce.order;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminOrderSummaryResponse(
        String orderNumber,
        Instant placedAt,
        String customerName,
        String customerEmail,
        String orderStatus,
        String paymentStatus,
        String paymentMethod,
        BigDecimal grandTotal,
        String currency
) {
    static AdminOrderSummaryResponse from(OrderEntity order) {
        return new AdminOrderSummaryResponse(
                order.getOrderNumber(), order.getPlacedAt(), order.getCustomerFirstNameSnapshot(),
                order.getCustomerEmailSnapshot(), order.getOrderStatus().name(), order.getPaymentStatus().name(),
                order.getPaymentMethod().name(), order.getGrandTotal(), order.getCurrency()
        );
    }
}
