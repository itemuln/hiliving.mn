package com.hiliving.commerce.order;

import com.hiliving.commerce.payment.PaymentInstructionsResponse;
import com.hiliving.commerce.payment.QpayPaymentService;
import org.springframework.stereotype.Service;

@Service
public class OrderCheckoutService {
    private final OrderService orders;
    private final QpayPaymentService qpay;

    public OrderCheckoutService(OrderService orders, QpayPaymentService qpay) {
        this.orders = orders;
        this.qpay = qpay;
    }

    public CheckoutResponse place(Long customerId, String idempotencyKey, PlaceOrderRequest request) {
        if (PaymentMethod.QPAY.name().equals(request.paymentMethod())) qpay.requireConfigured();
        OrderService.OrderPlacement placed = orders.place(customerId, idempotencyKey, request);
        PaymentInstructionsResponse payment = placed.order().paymentMethod().equals(PaymentMethod.QPAY.name())
                ? qpay.initiate(placed.orderId()) : null;
        return new CheckoutResponse(placed.order(), payment);
    }
}
