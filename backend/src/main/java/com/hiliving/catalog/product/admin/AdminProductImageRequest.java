package com.hiliving.catalog.product.admin;

import jakarta.validation.constraints.*;

public record AdminProductImageRequest(@NotBlank @Size(max=2048) String imageUrl,
                                       @Size(max=255) String altText,
                                       @Min(0) int sortOrder,
                                       boolean primaryImage) {}
