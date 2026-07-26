package com.hiliving.commerce.payment;

import com.hiliving.api.ApiResponse;
import com.hiliving.identity.auth.security.UserPrincipal;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/orders/{orderNumber}/payment")
public class PaymentController {
    private final QpayPaymentService payments;

    public PaymentController(QpayPaymentService payments) { this.payments = payments; }

    @GetMapping
    public ApiResponse<PaymentInstructionsResponse> findOwn(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable @Size(max = 32) @Pattern(regexp = "^HL-[0-9]{8}-[A-F0-9]{12}$") String orderNumber
    ) {
        return ApiResponse.of(payments.findOwn(orderNumber, principal.id()));
    }

    @PostMapping("/check")
    public ApiResponse<PaymentInstructionsResponse> check(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable @Size(max = 32) @Pattern(regexp = "^HL-[0-9]{8}-[A-F0-9]{12}$") String orderNumber
    ) {
        return ApiResponse.of(payments.reconcileOwn(orderNumber, principal.id()));
    }
}
