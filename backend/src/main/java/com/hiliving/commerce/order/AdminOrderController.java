package com.hiliving.commerce.order;

import com.hiliving.api.ApiResponse;
import com.hiliving.api.PagedResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/admin/orders")
public class AdminOrderController {
    private final OrderService orders;

    public AdminOrderController(OrderService orders) {
        this.orders = orders;
    }

    @GetMapping
    public ApiResponse<PagedResponse<AdminOrderSummaryResponse>> list(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) @Size(max = 100) String search,
            @RequestParam(required = false) OrderStatus orderStatus,
            @RequestParam(required = false) PaymentStatus paymentStatus
    ) {
        return ApiResponse.of(orders.listAdmin(page, size, search, orderStatus, paymentStatus));
    }

    @GetMapping("/{orderNumber}")
    public ApiResponse<AdminOrderDetailResponse> find(
            @PathVariable @Size(max = 32) @Pattern(regexp = "^HL-[0-9]{8}-[A-F0-9]{12}$") String orderNumber
    ) {
        return ApiResponse.of(orders.findAdmin(orderNumber));
    }

    @PatchMapping("/{orderNumber}/status")
    public ApiResponse<OrderResponse> updateStatus(
            @PathVariable @Size(max = 32) @Pattern(regexp = "^HL-[0-9]{8}-[A-F0-9]{12}$") String orderNumber,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        return ApiResponse.of(orders.updateStatus(orderNumber, request.status()));
    }
}
