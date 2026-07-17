package com.hiliving.commerce.order;

import com.hiliving.api.ApiResponse;
import com.hiliving.identity.auth.security.UserPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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

    public OrderController(OrderService orderService) { this.orderService = orderService; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<OrderResponse> place(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader("Idempotency-Key") @Size(max = 36) String idempotencyKey,
            @Valid @RequestBody PlaceOrderRequest request
    ) {
        return ApiResponse.of(orderService.place(principal.id(), idempotencyKey, request));
    }

    @GetMapping("/{orderNumber}")
    public ApiResponse<OrderResponse> findOwn(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable @Size(max = 32) @Pattern(regexp = "^HL-[0-9]{8}-[A-F0-9]{12}$") String orderNumber
    ) {
        return ApiResponse.of(orderService.findOwn(principal.id(), orderNumber));
    }
}
