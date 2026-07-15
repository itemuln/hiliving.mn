package com.hiliving.catalog.product.application;

import com.hiliving.api.PagedResponse;
import com.hiliving.api.error.ResourceNotFoundException;
import com.hiliving.catalog.brand.persistence.BrandEntity;
import com.hiliving.catalog.category.persistence.CategoryEntity;
import com.hiliving.catalog.product.api.CatalogReferenceResponse;
import com.hiliving.catalog.product.api.ProductDetailResponse;
import com.hiliving.catalog.product.api.ProductImageResponse;
import com.hiliving.catalog.product.api.ProductSummaryResponse;
import com.hiliving.catalog.product.persistence.ProductEntity;
import com.hiliving.catalog.product.persistence.ProductImageEntity;
import com.hiliving.catalog.product.persistence.ProductRepository;
import com.hiliving.catalog.product.persistence.ProductSpecifications;
import com.hiliving.catalog.product.persistence.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ProductSummaryResponse> findPublicProducts(ProductSearchCriteria criteria) {
        PageRequest pageRequest = PageRequest.of(
                criteria.page(),
                criteria.size(),
                criteria.sort().toSort()
        );
        Page<ProductSummaryResponse> products = productRepository.findAll(
                        ProductSpecifications.publicCatalog(
                                criteria.categorySlug(),
                                criteria.brandSlug(),
                                criteria.search(),
                                criteria.featured()
                        ),
                        pageRequest
                )
                .map(this::toSummaryResponse);

        return new PagedResponse<>(
                products.getContent(),
                products.getNumber(),
                products.getSize(),
                products.getTotalElements(),
                products.getTotalPages(),
                products.isFirst(),
                products.isLast()
        );
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse findPublicProduct(String slug) {
        ProductEntity product = productRepository.findPublicBySlug(slug, ProductStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Product was not found"));
        return toDetailResponse(product);
    }

    private ProductSummaryResponse toSummaryResponse(ProductEntity product) {
        String primaryImageUrl = product.getImages().stream()
                .filter(ProductImageEntity::isPrimaryImage)
                .map(ProductImageEntity::getImageUrl)
                .findFirst()
                .orElse(null);
        return new ProductSummaryResponse(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getShortDescription(),
                product.getPrice(),
                product.getDiscountPrice(),
                toReference(product.getCategory()),
                toReference(product.getBrand()),
                product.isFeatured(),
                primaryImageUrl,
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }

    private ProductDetailResponse toDetailResponse(ProductEntity product) {
        List<ProductImageResponse> images = product.getImages().stream()
                .map(this::toImageResponse)
                .toList();
        return new ProductDetailResponse(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getShortDescription(),
                product.getDescription(),
                product.getPrice(),
                product.getDiscountPrice(),
                toReference(product.getCategory()),
                toReference(product.getBrand()),
                product.isFeatured(),
                images,
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }

    private ProductImageResponse toImageResponse(ProductImageEntity image) {
        return new ProductImageResponse(
                image.getId(),
                image.getImageUrl(),
                image.getAltText(),
                image.getDisplayOrder(),
                image.isPrimaryImage()
        );
    }

    private CatalogReferenceResponse toReference(CategoryEntity category) {
        return new CatalogReferenceResponse(category.getId(), category.getName(), category.getSlug());
    }

    private CatalogReferenceResponse toReference(BrandEntity brand) {
        if (brand == null) {
            return null;
        }
        return new CatalogReferenceResponse(brand.getId(), brand.getName(), brand.getSlug());
    }
}
