package com.hiliving.identity.admin.api;

import com.hiliving.api.PagedResponse;
import com.hiliving.commerce.order.OrderSummaryResponse;

public record AdminUserOrderOverviewResponse(
        long cancelledCount,
        long shippedCount,
        PagedResponse<OrderSummaryResponse> orders
) {
}
