package com.hiliving.catalog.product.persistence;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;

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

    @Query("""
            select distinct product
            from ProductEntity product
            join fetch product.category category
            left join fetch product.brand brand
            left join fetch product.images images
            where product.slug in :slugs
            """)
    List<ProductEntity> findAllWithDetailsBySlugIn(@Param("slugs") Collection<String> slugs);

    @Query("select product.id from ProductEntity product where product.slug in :slugs order by product.id")
    List<Long> findIdsBySlugIn(@Param("slugs") Collection<String> slugs);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select product
            from ProductEntity product
            where product.id in :ids
            order by product.id
            """)
    List<ProductEntity> findAllByIdForUpdate(@Param("ids") Collection<Long> ids);

    @Query("""
            select product
            from ProductEntity product
            where product.category.id = :categoryId
              and product.id <> :productId
              and product.status = :status
              and product.active = true
              and product.category.active = true
              and (product.brand is null or product.brand.active = true)
            order by product.createdAt desc, product.id desc
            """)
    List<ProductEntity> findRelatedPublic(
            @Param("categoryId") Long categoryId,
            @Param("productId") Long productId,
            @Param("status") ProductStatus status,
            Pageable pageable
    );

    boolean existsBySlug(String slug);

    long countByCategoryId(Long categoryId);

    long countByBrandId(Long brandId);

    long countByStatus(ProductStatus status);

    long countByActiveTrue();
}
