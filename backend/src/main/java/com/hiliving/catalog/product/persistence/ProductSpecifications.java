package com.hiliving.catalog.product.persistence;

import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.Locale;

public final class ProductSpecifications {

    private ProductSpecifications() {
    }

    public static Specification<ProductEntity> publicCatalog(
            String categorySlug,
            String brandSlug,
            String search,
            Boolean featured
    ) {
        return (root, query, criteriaBuilder) -> {
            var category = root.join("category", JoinType.INNER);
            var brand = root.join("brand", JoinType.LEFT);
            var predicates = new ArrayList<>();

            predicates.add(criteriaBuilder.equal(root.get("status"), ProductStatus.ACTIVE));
            predicates.add(criteriaBuilder.isTrue(root.get("active")));
            predicates.add(criteriaBuilder.isTrue(category.get("active")));
            predicates.add(criteriaBuilder.or(
                    criteriaBuilder.isNull(root.get("brand")),
                    criteriaBuilder.isTrue(brand.get("active"))
            ));

            if (categorySlug != null) {
                predicates.add(criteriaBuilder.equal(category.get("slug"), categorySlug));
            }
            if (brandSlug != null) {
                predicates.add(criteriaBuilder.equal(brand.get("slug"), brandSlug));
            }
            if (featured != null) {
                predicates.add(criteriaBuilder.equal(root.get("featured"), featured));
            }
            if (search != null) {
                String pattern = "%" + escapeLike(search.toLowerCase(Locale.ROOT)) + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("name")),
                                pattern,
                                '\\'
                        ),
                        criteriaBuilder.like(
                                criteriaBuilder.lower(root.get("shortDescription")),
                                pattern,
                                '\\'
                        )
                ));
            }

            return criteriaBuilder.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    private static String escapeLike(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}
