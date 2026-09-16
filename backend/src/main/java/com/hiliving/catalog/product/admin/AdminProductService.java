package com.hiliving.catalog.product.admin;

import com.hiliving.admin.audit.AuditService;
import com.hiliving.api.PagedResponse;
import com.hiliving.api.error.ApiRequestException;
import com.hiliving.catalog.brand.persistence.BrandEntity;
import com.hiliving.catalog.brand.persistence.BrandRepository;
import com.hiliving.catalog.category.persistence.CategoryEntity;
import com.hiliving.catalog.category.persistence.CategoryRepository;
import com.hiliving.catalog.product.api.CatalogReferenceResponse;
import com.hiliving.catalog.product.api.ProductImageResponse;
import com.hiliving.catalog.product.persistence.ProductEntity;
import com.hiliving.catalog.product.persistence.ProductRepository;
import com.hiliving.catalog.product.persistence.ProductStatus;
import com.hiliving.content.HtmlContentSanitizer;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminProductService {

    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");
    private static final Pattern WHITESPACE_PATTERN = Pattern.compile("\\s+");

    private static final Map<String, Sort> SORTS = Map.of(
            "newest", Sort.by(Sort.Direction.DESC, "createdAt", "id"),
            "oldest", Sort.by("createdAt", "id"),
            "name_asc", Sort.by("name", "id"),
            "name_desc", Sort.by(Sort.Direction.DESC, "name").and(Sort.by("id")),
            "price_asc", Sort.by("price", "id"),
            "price_desc", Sort.by(Sort.Direction.DESC, "price").and(Sort.by("id")),
            "stock_asc", Sort.by("stockQuantity", "id"),
            "stock_desc", Sort.by(Sort.Direction.DESC, "stockQuantity").and(Sort.by("id")));

    private final ProductRepository products;
    private final CategoryRepository categories;
    private final BrandRepository brands;
    private final AuditService audit;
    private final ProductIdentifierGenerator identifiers;
    private final HtmlContentSanitizer htmlSanitizer;

    public AdminProductService(
            ProductRepository products,
            CategoryRepository categories,
            BrandRepository brands,
            AuditService audit,
            ProductIdentifierGenerator identifiers,
            HtmlContentSanitizer htmlSanitizer) {
        this.products = products;
        this.categories = categories;
        this.brands = brands;
        this.audit = audit;
        this.identifiers = identifiers;
        this.htmlSanitizer = htmlSanitizer;
    }

    @Transactional(readOnly = true)
    public PagedResponse<AdminProductResponse> list(
            int page,
            int size,
            String search,
            Long categoryId,
            Long brandId,
            ProductStatus lifecycle,
            Boolean featured,
            Boolean newProduct,
            Boolean active,
            Boolean membershipEligible,
            InventoryState inventoryState,
            Boolean lowStock,
            String sort) {
        Sort selectedSort = SORTS.get(sort);
        if (selectedSort == null) {
            throw validation("sort", "Unsupported sort value");
        }

        Page<AdminProductResponse> result = products.findAll(
                        AdminProductSpecifications.filter(
                                search,
                                categoryId,
                                brandId,
                                lifecycle,
                                featured,
                                newProduct,
                                active,
                                membershipEligible,
                                inventoryState,
                                lowStock),
                        PageRequest.of(page, size, selectedSort))
                .map(this::response);

        return new PagedResponse<>(
                result.getContent(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isFirst(),
                result.isLast());
    }

    @Transactional(readOnly = true)
    public AdminProductResponse find(Long id) {
        return response(require(id));
    }

    @Transactional
    public AdminProductResponse create(AdminProductRequest request) {
        validate(request);

        CategoryEntity category = category(request.categoryId());
        BrandEntity brand = brand(request.brandId());
        String name = clean(request.name());
        String description = sanitizeDescription(request.description());

        ProductEntity product = ProductEntity.create(
                name,
                identifiers.uniqueSlug(name),
                descriptionSummary(description),
                description,
                request.basePrice(),
                request.discountPrice(),
                category,
                brand,
                request.lifecycle(),
                request.featured());

        product.initializeAdministrationFields(
                identifiers.nextProductCode(),
                request.stockQuantity(),
                request.lowStockThreshold(),
                request.membershipDiscountEligible(),
                request.newProduct(),
                request.active());
        addImages(product, request.images());
        products.saveAndFlush(product);

        audit.record("PRODUCT_CREATED", "PRODUCT", product.getId(), product.getProductCode());
        return response(product);
    }

    @Transactional
    public AdminProductResponse update(Long id, AdminProductRequest request) {
        ProductEntity product = require(id);
        validate(request);

        CategoryEntity category = category(request.categoryId());
        BrandEntity brand = brand(request.brandId());
        boolean priceChanged = hasPriceChanged(product, request);
        boolean inventoryChanged = hasInventoryChanged(product, request);
        boolean eligibilityChanged =
                product.isMembershipDiscountEligible() != request.membershipDiscountEligible();
        boolean imagesChanged = haveImagesChanged(product, request.images());
        String description = sanitizeDescription(request.description());

        product.update(
                clean(request.name()),
                descriptionSummary(description),
                description,
                request.basePrice(),
                request.discountPrice(),
                category,
                brand,
                request.lifecycle(),
                request.featured(),
                request.newProduct(),
                request.active(),
                request.stockQuantity(),
                request.lowStockThreshold(),
                request.membershipDiscountEligible());

        replaceImages(product, request.images());
        recordUpdateAudit(
                product,
                priceChanged,
                inventoryChanged,
                eligibilityChanged,
                imagesChanged);

        return response(product);
    }

    @Transactional
    public AdminProductResponse archive(Long id) {
        ProductEntity product = require(id);
        product.changeStatus(ProductStatus.ARCHIVED);
        audit.record("PRODUCT_ARCHIVED", "PRODUCT", id, product.getProductCode());
        return response(product);
    }

    @Transactional
    public AdminProductResponse restore(Long id) {
        ProductEntity product = require(id);
        product.changeStatus(ProductStatus.DRAFT);
        audit.record("PRODUCT_RESTORED", "PRODUCT", id, product.getProductCode());
        return response(product);
    }

    @Transactional
    public void delete(Long id) {
        ProductEntity product = require(id);
        products.delete(product);
        audit.record("PRODUCT_DELETED", "PRODUCT", id, product.getProductCode());
    }

    private void validate(AdminProductRequest request) {
        if (request.discountPrice() != null
                && request.discountPrice().compareTo(request.basePrice()) >= 0) {
            throw new ApiRequestException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_DISCOUNT_PRICE",
                    "Discount price must be lower than base price");
        }

        if (request.images().size() > 6) {
            throw new ApiRequestException(
                    HttpStatus.BAD_REQUEST,
                    "PRODUCT_IMAGE_LIMIT_EXCEEDED",
                    "A product may have at most six images");
        }

        long primaryImageCount = request.images().stream()
                .filter(AdminProductImageRequest::primaryImage)
                .count();
        boolean activeProductRequiresPrimaryImage =
                request.lifecycle() == ProductStatus.ACTIVE && request.active();
        if (primaryImageCount > 1 || (activeProductRequiresPrimaryImage && primaryImageCount != 1)) {
            throw new ApiRequestException(
                    HttpStatus.BAD_REQUEST,
                    "PRODUCT_PRIMARY_IMAGE_INVALID",
                    "An active product requires exactly one primary image");
        }

        long distinctSortOrders = request.images().stream()
                .map(AdminProductImageRequest::sortOrder)
                .distinct()
                .count();
        if (distinctSortOrders != request.images().size()) {
            throw validation("images", "Image sort order must be unique");
        }

        long distinctImageUrls = request.images().stream()
                .map(image -> image.imageUrl().trim())
                .distinct()
                .count();
        if (distinctImageUrls != request.images().size()) {
            throw validation("images", "Image URLs must be unique");
        }
    }

    private void replaceImages(ProductEntity product, List<AdminProductImageRequest> images) {
        product.clearImages();
        products.flush();
        addImages(product, images);
        products.flush();
    }

    private void addImages(ProductEntity product, List<AdminProductImageRequest> images) {
        images.stream()
                .sorted(Comparator.comparingInt(AdminProductImageRequest::sortOrder))
                .forEach(image -> product.addImage(
                        image.imageUrl().trim(),
                        cleanNullable(image.altText()),
                        image.sortOrder(),
                        image.primaryImage(),
                        image.displayScale()));
    }

    private boolean haveImagesChanged(
            ProductEntity product, List<AdminProductImageRequest> requestedImages) {
        List<String> currentImages = product.getImages().stream()
                .map(image -> imageSignature(
                        image.getImageUrl(), image.isPrimaryImage(), image.getDisplayScale()))
                .toList();
        List<String> newImages = requestedImages.stream()
                .sorted(Comparator.comparingInt(AdminProductImageRequest::sortOrder))
                .map(image -> imageSignature(
                        image.imageUrl().trim(), image.primaryImage(), image.displayScale()))
                .toList();
        return !currentImages.equals(newImages);
    }

    private static String imageSignature(String imageUrl, boolean primaryImage, int displayScale) {
        return imageUrl + "\u0000" + primaryImage + "\u0000" + displayScale;
    }

    private static boolean hasPriceChanged(ProductEntity product, AdminProductRequest request) {
        return product.getPrice().compareTo(request.basePrice()) != 0
                || !Objects.equals(product.getDiscountPrice(), request.discountPrice());
    }

    private static boolean hasInventoryChanged(ProductEntity product, AdminProductRequest request) {
        return product.getStockQuantity() != request.stockQuantity()
                || product.getLowStockThreshold() != request.lowStockThreshold();
    }

    private void recordUpdateAudit(
            ProductEntity product,
            boolean priceChanged,
            boolean inventoryChanged,
            boolean eligibilityChanged,
            boolean imagesChanged) {
        Long productId = product.getId();
        audit.record("PRODUCT_UPDATED", "PRODUCT", productId, product.getProductCode());
        if (priceChanged) {
            audit.record("PRODUCT_PRICE_CHANGED", "PRODUCT", productId, null);
        }
        if (inventoryChanged) {
            audit.record("PRODUCT_INVENTORY_CHANGED", "PRODUCT", productId, null);
        }
        if (eligibilityChanged) {
            audit.record(
                    "PRODUCT_MEMBERSHIP_ELIGIBILITY_CHANGED",
                    "PRODUCT",
                    productId,
                    String.valueOf(product.isMembershipDiscountEligible()));
        }
        if (imagesChanged) {
            audit.record("PRODUCT_IMAGE_CHANGED", "PRODUCT", productId, null);
        }
    }

    private ProductEntity require(Long id) {
        return products.findWithDetailsById(id)
                .orElseThrow(() -> new ApiRequestException(
                        HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND", "Product was not found"));
    }

    private CategoryEntity category(Long id) {
        return categories.findById(id)
                .orElseThrow(() -> new ApiRequestException(
                        HttpStatus.BAD_REQUEST, "CATEGORY_NOT_FOUND", "Category was not found"));
    }

    private BrandEntity brand(Long id) {
        if (id == null) {
            return null;
        }
        return brands.findById(id)
                .orElseThrow(() -> new ApiRequestException(
                        HttpStatus.BAD_REQUEST, "BRAND_NOT_FOUND", "Brand was not found"));
    }

    private AdminProductResponse response(ProductEntity product) {
        return new AdminProductResponse(
                product.getId(),
                product.getName(),
                product.getSlug(),
                product.getProductCode(),
                product.getShortDescription(),
                product.getDescription(),
                product.getPrice(),
                product.getDiscountPrice(),
                reference(product.getCategory()),
                reference(product.getBrand()),
                product.getStatus(),
                product.getStockQuantity(),
                product.getLowStockThreshold(),
                InventoryState.of(product.getStockQuantity(), product.getLowStockThreshold()),
                product.isFeatured(),
                product.isNewProduct(),
                product.isActive(),
                product.isMembershipDiscountEligible(),
                product.getImages().stream()
                        .map(image -> new ProductImageResponse(
                                image.getId(),
                                image.getImageUrl(),
                                image.getAltText(),
                                image.getDisplayOrder(),
                                image.isPrimaryImage(),
                                image.getDisplayScale()))
                        .toList(),
                product.getCreatedAt(),
                product.getUpdatedAt());
    }

    private CatalogReferenceResponse reference(CategoryEntity category) {
        return new CatalogReferenceResponse(category.getId(), category.getName(), category.getSlug());
    }

    private CatalogReferenceResponse reference(BrandEntity brand) {
        if (brand == null) {
            return null;
        }
        return new CatalogReferenceResponse(brand.getId(), brand.getName(), brand.getSlug());
    }

    private String sanitizeDescription(String value) {
        return cleanNullable(htmlSanitizer.sanitize(value));
    }

    private static ApiRequestException validation(String field, String message) {
        return new ApiRequestException(
                HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", field + ": " + message);
    }

    private static String clean(String value) {
        return value.trim();
    }

    private static String cleanNullable(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String descriptionSummary(String value) {
        if (value == null) {
            return null;
        }

        String text = HTML_TAG_PATTERN.matcher(value).replaceAll(" ")
                .replace("&nbsp;", " ")
                .replace("&#160;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&#39;", "'");
        text = WHITESPACE_PATTERN.matcher(text).replaceAll(" ").trim();

        if (text.isBlank()) {
            return null;
        }

        int codePointCount = text.codePointCount(0, text.length());
        int endIndex = text.offsetByCodePoints(0, Math.min(500, codePointCount));
        return text.substring(0, endIndex);
    }
}
