package com.hiliving.catalog.product.application;

import com.hiliving.api.error.InvalidRequestException;

public record ProductSearchCriteria(
        int page,
        int size,
        String categorySlug,
        String brandSlug,
        String search,
        Boolean featured,
        ProductSortOption sort
) {

    public ProductSearchCriteria {
        if (page < 0) {
            throw new InvalidRequestException("page", "Page must be zero or greater");
        }
        if (size < 1 || size > 100) {
            throw new InvalidRequestException("size", "Size must be between 1 and 100");
        }
        if (search != null && search.strip().length() > 100) {
            throw new InvalidRequestException("search", "Search must not exceed 100 characters");
        }
        categorySlug = normalize(categorySlug);
        brandSlug = normalize(brandSlug);
        search = normalize(search);
        if (sort == null) {
            throw new InvalidRequestException("sort", "Sort is required");
        }
    }

    private static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.strip();
    }
}
