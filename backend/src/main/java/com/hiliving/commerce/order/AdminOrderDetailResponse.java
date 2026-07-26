package com.hiliving.commerce.order;

public record AdminOrderDetailResponse(
        String customerName,
        String customerEmail,
        OrderResponse order
) {
    static AdminOrderDetailResponse from(OrderEntity order) {
        return new AdminOrderDetailResponse(
                order.getCustomerFirstNameSnapshot(), order.getCustomerEmailSnapshot(), OrderResponse.from(order)
        );
    }
}
