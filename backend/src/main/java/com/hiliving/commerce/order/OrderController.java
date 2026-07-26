package com.hiliving.commerce.order;

import com.hiliving.api.ApiResponse;
import com.hiliving.identity.auth.security.UserPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import org.springframework.web.bind.annotation.RequestParam;
import com.hiliving.api.PagedResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final OrderService orderService;
    private final OrderCheckoutService checkoutService;

    public OrderController(OrderService orderService, OrderCheckoutService checkoutService) {
        this.orderService = orderService;
        this.checkoutService = checkoutService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CheckoutResponse> place(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader("Idempotency-Key") @Size(max = 36) String idempotencyKey,
            @Valid @RequestBody PlaceOrderRequest request
    ) {
        return ApiResponse.of(checkoutService.place(principal.id(), idempotencyKey, request));
    }

    @GetMapping
    public ApiResponse<PagedResponse<OrderSummaryResponse>> listOwn(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return ApiResponse.of(orderService.listOwn(principal.id(), page, size));
    }

    @GetMapping("/{orderNumber}")
    public ApiResponse<OrderResponse> findOwn(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable @Size(max = 32) @Pattern(regexp = "^HL-[0-9]{8}-[A-F0-9]{12}$") String orderNumber
    ) {
        return ApiResponse.of(orderService.findOwn(principal.id(), orderNumber));
    }
}
