package com.hiliving.commerce.payment;

import com.hiliving.commerce.order.OrderEntity;
import com.hiliving.commerce.order.PaymentMethod;

/** Future providers implement initiation and authenticated callback verification behind this boundary. */
public interface PaymentProvider {
    PaymentMethod method();
    PaymentInitiation initiate(OrderEntity order);
    boolean verifyCallback(String payload, String signature);

    record PaymentInitiation(String providerReference, String redirectUrl, String qrPayload) {}
}
