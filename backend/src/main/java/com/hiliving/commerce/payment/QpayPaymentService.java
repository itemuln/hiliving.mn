package com.hiliving.commerce.payment;

import com.hiliving.api.error.ApiRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
public class QpayPaymentService {
    private final QpayClient qpay;
    private final PaymentStateService state;

    public QpayPaymentService(QpayClient qpay, PaymentStateService state) {
        this.qpay = qpay;
        this.state = state;
    }

    public void requireConfigured() {
        if (!qpay.configured()) {
            throw new ApiRequestException(HttpStatus.SERVICE_UNAVAILABLE, "QPAY_NOT_CONFIGURED", "QPay is not configured");
        }
    }

    public PaymentInstructionsResponse initiate(Long orderId) {
        requireConfigured();
        PaymentStateService.Preparation preparation = state.prepare(orderId);
        if (preparation.existing()) return state.instructions(preparation.attemptId());
        try {
            String callbackUrl = qpay.callbackBaseUrl().replaceAll("/+$", "")
                    + "/api/v1/payments/qpay/callback/" + preparation.callbackToken();
            QpayClient.InvoiceResponse response = qpay.createInvoice(new QpayClient.InvoiceRequest(
                    qpay.invoiceCode(), preparation.senderInvoiceNo(), preparation.customerCode(),
                    "HiLiving order " + preparation.orderNumber().replace("-", ""), false,
                    false, false, preparation.amount(), callbackUrl
            ));
            return state.recordInvoice(preparation.attemptId(), response);
        } catch (QpayProviderException exception) {
            state.recordFailure(preparation.attemptId(), exception.getCode());
            throw providerError(exception);
        }
    }

    public PaymentInstructionsResponse findOwn(String orderNumber, Long customerId) {
        return state.findOwned(orderNumber, customerId).instructions();
    }

    public PaymentInstructionsResponse reconcileOwn(String orderNumber, Long customerId) {
        PaymentStateService.OwnedAttempt owned = state.findOwned(orderNumber, customerId);
        if (owned.instructions().status().equals(PaymentAttemptStatus.PAID.name())) return owned.instructions();
        return reconcile(owned.attemptId(), owned.invoiceId(), null);
    }

    public boolean reconcileCallback(String callbackToken, String paymentId) {
        PaymentStateService.CallbackAttempt callback = state.findCallback(callbackToken);
        if (callback.status() == PaymentAttemptStatus.PAID) return true;
        PaymentInstructionsResponse response = reconcile(callback.attemptId(), callback.invoiceId(), paymentId);
        return response.status().equals(PaymentAttemptStatus.PAID.name());
    }

    private PaymentInstructionsResponse reconcile(Long attemptId, String invoiceId, String callbackPaymentId) {
        if (invoiceId == null || invoiceId.isBlank()) {
            throw new ApiRequestException(HttpStatus.CONFLICT, "QPAY_INVOICE_NOT_READY", "QPay invoice is not ready");
        }
        try {
            QpayClient.PaymentCheckResponse checked = qpay.checkPayment(invoiceId);
            QpayClient.PaymentRow paid = checked.rows().stream()
                    .filter(row -> "PAID".equals(row.paymentStatus()))
                    .filter(row -> callbackPaymentId == null || Objects.equals(callbackPaymentId, row.paymentId()))
                    .findFirst().orElse(null);
            PaymentInstructionsResponse current = state.instructions(attemptId);
            if (paid == null) return current;
            if (!"MNT".equals(paid.paymentCurrency()) || paid.paymentAmount() == null
                    || paid.paymentAmount().compareTo(current.amount()) != 0) {
                state.requireReconciliation(attemptId, "PAID_AMOUNT_OR_CURRENCY_MISMATCH");
                throw new ApiRequestException(HttpStatus.CONFLICT, "PAYMENT_RECONCILIATION_REQUIRED",
                        "Paid amount or currency does not match the order");
            }
            return state.confirmPaid(attemptId, paid);
        } catch (QpayProviderException exception) {
            throw providerError(exception);
        }
    }

    private ApiRequestException providerError(QpayProviderException exception) {
        HttpStatus status = "QPAY_NOT_CONFIGURED".equals(exception.getCode())
                ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.BAD_GATEWAY;
        return new ApiRequestException(status, exception.getCode(), exception.getMessage());
    }
}
