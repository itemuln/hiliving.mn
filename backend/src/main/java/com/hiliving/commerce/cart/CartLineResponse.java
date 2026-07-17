package com.hiliving.commerce.cart;

import java.math.BigDecimal;
import java.util.List;

public record CartLineResponse(
        Long productId,
        String productSlug,
        String productName,
        String sku,
        String primaryImageUrl,
        int requestedQuantity,
        int availableQuantity,
        BigDecimal unitRegularPrice,
        BigDecimal unitCatalogPrice,
        BigDecimal unitEffectivePrice,
        BigDecimal membershipDiscountPercentage,
        BigDecimal discountAmount,
        BigDecimal lineSubtotal,
        boolean membershipDiscountEligible,
        String inventoryStatus,
        List<String> warnings
) {
}
