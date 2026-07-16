package com.hiliving.catalog.product.admin;

import com.hiliving.catalog.product.api.CatalogReferenceResponse;
import com.hiliving.catalog.product.api.ProductImageResponse;
import com.hiliving.catalog.product.persistence.ProductStatus;
import java.math.BigDecimal; import java.time.Instant; import java.util.List;

public record AdminProductResponse(
        Long id, String name, String slug, String productCode, String shortDescription, String description,
        BigDecimal basePrice, BigDecimal discountPrice, CatalogReferenceResponse category, CatalogReferenceResponse brand,
        ProductStatus lifecycle, int stockQuantity, int lowStockThreshold, InventoryState inventoryState,
        boolean featured, boolean newProduct, boolean active, boolean membershipDiscountEligible,
        List<ProductImageResponse> images, Instant createdAt, Instant updatedAt
) {}
