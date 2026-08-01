package com.hiliving.commerce.order;

import java.math.BigDecimal;
import java.time.Instant;

public record OrderSummaryResponse(
        String orderNumber,
        Instant placedAt,
        String orderStatus,
        String paymentStatus,
        String paymentMethod,
        BigDecimal grandTotal,
        String currency,
        int itemCount
) {
    public static OrderSummaryResponse from(OrderEntity order) {
        return new OrderSummaryResponse(
                order.getOrderNumber(), order.getPlacedAt(), order.getOrderStatus().name(),
                order.getPaymentStatus().name(), order.getPaymentMethod().name(), order.getGrandTotal(),
                order.getCurrency(), order.getItems().stream().mapToInt(OrderItemEntity::getQuantity).sum()
        );
    }
}
