package com.hiliving.catalog.product.api;

public record ProductImageResponse(
        Long id,
        String imageUrl,
        String altText,
        int displayOrder,
        boolean primaryImage
) {
}
