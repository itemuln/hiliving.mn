package com.hiliving.catalog.product.api;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ProductDetailResponse(
        Long id,
        String name,
        String slug,
        String shortDescription,
        String description,
        BigDecimal price,
        BigDecimal discountPrice,
        CatalogReferenceResponse category,
        CatalogReferenceResponse brand,
        boolean featured,
        List<ProductImageResponse> images,
        Instant createdAt,
        Instant updatedAt
) {
}
