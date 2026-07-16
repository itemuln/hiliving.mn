package com.hiliving.catalog.product.persistence;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends
        JpaRepository<ProductEntity, Long>,
        JpaSpecificationExecutor<ProductEntity> {

    @Query("""
            select distinct product
            from ProductEntity product
            join fetch product.category category
            left join fetch product.brand brand
            left join fetch product.images images
            where product.slug = :slug
              and product.status = :status
              and product.active = true
              and category.active = true
              and (brand is null or brand.active = true)
            """)
    Optional<ProductEntity> findPublicBySlug(
            @Param("slug") String slug,
            @Param("status") ProductStatus status
    );

    @EntityGraph(attributePaths = {"category", "brand", "images"})
    Optional<ProductEntity> findWithDetailsById(Long id);

    boolean existsBySlugAndIdNot(String slug, Long id);

    boolean existsByProductCodeAndIdNot(String productCode, Long id);

    long countByCategoryId(Long categoryId);

    long countByBrandId(Long brandId);

    long countByStatus(ProductStatus status);

    long countByActiveTrue();
}
