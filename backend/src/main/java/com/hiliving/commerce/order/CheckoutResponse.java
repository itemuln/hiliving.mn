package com.hiliving.commerce.order;

import com.hiliving.commerce.payment.PaymentInstructionsResponse;

public record CheckoutResponse(OrderResponse order, PaymentInstructionsResponse payment) {
}
