package com.hiliving.commerce.order;

import com.hiliving.api.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/admin/orders")
public class AdminOrderController {
    private final OrderService orders;
    public AdminOrderController(OrderService orders) { this.orders = orders; }

    @PatchMapping("/{orderNumber}/status")
    public ApiResponse<OrderResponse> updateStatus(
            @PathVariable @Size(max = 32) @Pattern(regexp = "^HL-[0-9]{8}-[A-F0-9]{12}$") String orderNumber,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        return ApiResponse.of(orders.updateStatus(orderNumber, request.status()));
    }
}
