package com.hiliving.catalog.product.admin;

import com.hiliving.catalog.product.persistence.ProductStatus;
import jakarta.validation.Valid; import jakarta.validation.constraints.*;
import java.math.BigDecimal; import java.util.List;

public record AdminProductRequest(
        @NotBlank @Size(max=240) String name,
        String description,
        @NotNull @DecimalMin("0.00") @Digits(integer=10,fraction=2) BigDecimal basePrice,
        @DecimalMin("0.00") @Digits(integer=10,fraction=2) BigDecimal discountPrice,
        @NotNull @Positive Long categoryId,
        @Positive Long brandId,
        @NotNull ProductStatus lifecycle,
        @Min(0) int stockQuantity,
        @Min(0) int lowStockThreshold,
        boolean featured, boolean newProduct, boolean active,
        @NotNull Boolean membershipDiscountEligible,
        @NotNull @Size(max=6) List<@Valid AdminProductImageRequest> images
) {}
