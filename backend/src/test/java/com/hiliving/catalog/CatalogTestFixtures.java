package com.hiliving.catalog;

import com.hiliving.catalog.brand.persistence.BrandEntity;
import com.hiliving.catalog.category.persistence.CategoryEntity;
import com.hiliving.catalog.product.persistence.ProductEntity;
import com.hiliving.catalog.product.persistence.ProductStatus;

import java.math.BigDecimal;

public final class CatalogTestFixtures {

    private CatalogTestFixtures() {
    }

    public static CategoryEntity category(String name, String slug, boolean active) {
        return CategoryEntity.create(name, slug, null, 10, active);
    }

    public static BrandEntity brand(String name, String slug, boolean active) {
        return BrandEntity.create(name, slug, null, active);
    }

    public static ProductEntity product(
            String name,
            String slug,
            String searchText,
            BigDecimal price,
            CategoryEntity category,
            BrandEntity brand,
            ProductStatus status,
            boolean featured
    ) {
        ProductEntity product = ProductEntity.create(
                name,
                slug,
                searchText,
                "Test-only catalog description",
                price,
                null,
                category,
                brand,
                status,
                featured
        );
        product.addImage("/test/" + slug + ".png", name, 0, true);
        return product;
    }
}
