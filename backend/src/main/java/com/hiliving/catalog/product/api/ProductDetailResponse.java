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
        String sku,
        BigDecimal price,
        BigDecimal discountPrice,
        BigDecimal effectiveCustomerPrice,
        BigDecimal membershipDiscountPercentage,
        BigDecimal membershipSavings,
        boolean membershipDiscountEligible,
        int availableQuantity,
        String inventoryStatus,
        CatalogReferenceResponse category,
        CatalogReferenceResponse brand,
        boolean featured,
        boolean published,
        String primaryImageUrl,
        List<ProductImageResponse> images,
        List<ProductSummaryResponse> relatedProducts,
        Instant createdAt,
        Instant updatedAt
) {
}
