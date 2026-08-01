package com.hiliving.commerce.order;

import java.math.BigDecimal;

public interface CustomerOrderMetrics {
    Long getCustomerId();
    long getOrderCount();
    BigDecimal getTotalPaid();
}
