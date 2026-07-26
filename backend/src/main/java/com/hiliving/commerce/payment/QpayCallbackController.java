package com.hiliving.commerce.payment;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/payments/qpay/callback")
public class QpayCallbackController {
    private final QpayPaymentService payments;

    public QpayCallbackController(QpayPaymentService payments) { this.payments = payments; }

    @GetMapping(value = "/{callbackToken}", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> callback(
            @PathVariable @Pattern(regexp = "^[0-9a-f-]{36}$") String callbackToken,
            @RequestParam("qpay_payment_id") @Size(max = 64) String paymentId
    ) {
        if (!payments.reconcileCallback(callbackToken, paymentId)) {
            return ResponseEntity.status(503).body("RETRY");
        }
        return ResponseEntity.ok("SUCCESS");
    }
}
