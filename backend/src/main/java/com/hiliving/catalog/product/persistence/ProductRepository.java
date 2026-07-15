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

    @EntityGraph(attributePaths = {"category", "brand", "images"})
    @Query("""
            select product
            from ProductEntity product
            where product.slug = :slug
              and product.status = :status
              and product.category.active = true
              and (product.brand is null or product.brand.active = true)
            """)
    Optional<ProductEntity> findPublicBySlug(
            @Param("slug") String slug,
            @Param("status") ProductStatus status
    );
}
