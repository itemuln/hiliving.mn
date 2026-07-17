package com.hiliving.commerce.cart;

import java.math.BigDecimal;
import java.util.List;

public record CartQuoteResponse(
        List<CartLineResponse> items,
        BigDecimal regularSubtotal,
        BigDecimal catalogDiscountTotal,
        BigDecimal membershipDiscountTotal,
        BigDecimal discountTotal,
        BigDecimal effectiveSubtotal,
        BigDecimal shippingAmount,
        BigDecimal grandTotal,
        String currency,
        boolean valid
) {
}
