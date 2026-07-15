package com.hiliving.catalog.product.api;

import java.math.BigDecimal;
import java.time.Instant;

public record ProductSummaryResponse(
        Long id,
        String name,
        String slug,
        String shortDescription,
        BigDecimal price,
        BigDecimal discountPrice,
        CatalogReferenceResponse category,
        CatalogReferenceResponse brand,
        boolean featured,
        String primaryImageUrl,
        Instant createdAt,
        Instant updatedAt
) {
}
