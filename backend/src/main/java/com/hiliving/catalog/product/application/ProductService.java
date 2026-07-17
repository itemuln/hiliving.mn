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
import com.hiliving.commerce.pricing.PricingService;
import com.hiliving.identity.user.persistence.UserEntity;
import com.hiliving.identity.user.persistence.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.math.BigDecimal;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository users;
    private final PricingService pricing;

    public ProductService(ProductRepository productRepository, UserRepository users, PricingService pricing) {
        this.productRepository = productRepository;
        this.users = users;
        this.pricing = pricing;
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
        return findPublicProduct(slug, null);
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse findPublicProduct(String slug, Long customerId) {
        ProductEntity product = productRepository.findPublicBySlug(slug, ProductStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Product was not found"));
        UserEntity customer = customerId == null ? null : users.findById(customerId).orElse(null);
        return toDetailResponse(product, customer);
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

    private ProductDetailResponse toDetailResponse(ProductEntity product, UserEntity customer) {
        List<ProductImageResponse> images = product.getImages().stream()
                .map(this::toImageResponse)
                .toList();
        BigDecimal membershipPercentage = customer == null ? BigDecimal.ZERO : customer.effectiveDiscountPercentage();
        PricingService.PricedProduct priced = pricing.price(product, membershipPercentage);
        List<ProductSummaryResponse> related = productRepository.findRelatedPublic(
                        product.getCategory().getId(), product.getId(), ProductStatus.ACTIVE, PageRequest.of(0, 4))
                .stream().map(this::toSummaryResponse).toList();
        String primaryImageUrl = product.getImages().stream()
                .filter(ProductImageEntity::isPrimaryImage)
                .map(ProductImageEntity::getImageUrl)
                .findFirst().orElse(images.isEmpty() ? null : images.getFirst().imageUrl());
        return new ProductDetailResponse(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getShortDescription(),
                product.getDescription(),
                product.getProductCode(),
                product.getPrice(),
                product.getDiscountPrice(),
                priced.effectivePrice(),
                priced.membershipPercentage(),
                priced.catalogPrice().subtract(priced.effectivePrice()),
                product.isMembershipDiscountEligible(),
                product.getStockQuantity(),
                product.getStockQuantity() == 0 ? "OUT_OF_STOCK"
                        : product.getStockQuantity() <= product.getLowStockThreshold() ? "LOW_STOCK" : "IN_STOCK",
                toReference(product.getCategory()),
                toReference(product.getBrand()),
                product.isFeatured(),
                true,
                primaryImageUrl,
                images,
                related,
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
