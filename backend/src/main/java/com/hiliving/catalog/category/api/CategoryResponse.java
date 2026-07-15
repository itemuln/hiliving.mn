package com.hiliving.catalog.category.api;

public record CategoryResponse(
        Long id,
        String name,
        String slug,
        String parentSlug,
        int displayOrder
) {
}
