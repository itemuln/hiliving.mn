package com.hiliving.catalog.product.persistence;

import com.hiliving.catalog.brand.persistence.BrandEntity;
import com.hiliving.catalog.category.persistence.CategoryEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "products")
public class ProductEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 240)
    @Column(nullable = false, length = 240)
    private String name;

    @NotBlank
    @Size(max = 260)
    @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$")
    @Column(nullable = false, unique = true, length = 260)
    private String slug;

    @NotBlank
    @Size(max = 80)
    @Column(name = "product_code", nullable = false, unique = true, length = 80)
    private String productCode;

    @Size(max = 500)
    @Column(name = "short_description", length = 500)
    private String shortDescription;

    @Column(columnDefinition = "text")
    private String description;

    @NotNull
    @DecimalMin("0.00")
    @Digits(integer = 10, fraction = 2)
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @DecimalMin("0.00")
    @Digits(integer = 10, fraction = 2)
    @Column(name = "discount_price", precision = 12, scale = 2)
    private BigDecimal discountPrice;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private CategoryEntity category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private BrandEntity brand;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProductStatus status;

    @Column(nullable = false)
    private boolean featured;

    @Column(name = "stock_quantity", nullable = false)
    private int stockQuantity;

    @Column(name = "low_stock_threshold", nullable = false)
    private int lowStockThreshold;

    @Column(name = "membership_discount_eligible", nullable = false)
    private boolean membershipDiscountEligible = true;

    @Column(name = "new_product", nullable = false)
    private boolean newProduct;

    @Column(nullable = false)
    private boolean active = true;

    @NotNull
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @NotNull
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @BatchSize(size = 50)
    @OrderBy("displayOrder ASC, id ASC")
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductImageEntity> images = new ArrayList<>();

    protected ProductEntity() {
    }

    private ProductEntity(
            String name,
            String slug,
            String shortDescription,
            String description,
            BigDecimal price,
            BigDecimal discountPrice,
            CategoryEntity category,
            BrandEntity brand,
            ProductStatus status,
            boolean featured
    ) {
        this.name = name;
        this.slug = slug;
        this.productCode = slug.toUpperCase(java.util.Locale.ROOT);
        this.shortDescription = shortDescription;
        this.description = description;
        this.price = price;
        this.discountPrice = discountPrice;
        this.category = category;
        this.brand = brand;
        this.status = status;
        this.featured = featured;
        this.membershipDiscountEligible = true;
        this.active = true;
    }

    public static ProductEntity create(
            String name,
            String slug,
            String shortDescription,
            String description,
            BigDecimal price,
            BigDecimal discountPrice,
            CategoryEntity category,
            BrandEntity brand,
            ProductStatus status,
            boolean featured
    ) {
        return new ProductEntity(
                name,
                slug,
                shortDescription,
                description,
                price,
                discountPrice,
                category,
                brand,
                status,
                featured
        );
    }

    public void addImage(String imageUrl, String altText, int displayOrder, boolean primaryImage) {
        images.add(ProductImageEntity.create(this, imageUrl, altText, displayOrder, primaryImage));
    }

    public void initializeAdministrationFields(String productCode, int stockQuantity, int lowStockThreshold,
                                               boolean membershipDiscountEligible, boolean newProduct, boolean active) {
        this.productCode = productCode;
        this.stockQuantity = stockQuantity;
        this.lowStockThreshold = lowStockThreshold;
        this.membershipDiscountEligible = membershipDiscountEligible;
        this.newProduct = newProduct;
        this.active = active;
    }

    public void update(String name, String slug, String productCode, String shortDescription, String description,
                       BigDecimal price, BigDecimal discountPrice, CategoryEntity category, BrandEntity brand,
                       ProductStatus status, boolean featured, boolean newProduct, boolean active,
                       int stockQuantity, int lowStockThreshold, boolean membershipDiscountEligible) {
        this.name = name; this.slug = slug; this.productCode = productCode;
        this.shortDescription = shortDescription; this.description = description; this.price = price;
        this.discountPrice = discountPrice; this.category = category; this.brand = brand; this.status = status;
        this.featured = featured; this.newProduct = newProduct; this.active = active;
        this.stockQuantity = stockQuantity; this.lowStockThreshold = lowStockThreshold;
        this.membershipDiscountEligible = membershipDiscountEligible;
    }

    public void replaceImages(List<ProductImageEntity> replacements) {
        images.clear();
        replacements.forEach(image -> images.add(ProductImageEntity.copyFor(this, image)));
    }

    public void clearImages() { images.clear(); }

    public void changeStatus(ProductStatus status) { this.status = status; }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getSlug() {
        return slug;
    }

    public String getProductCode() { return productCode; }

    public String getShortDescription() {
        return shortDescription;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public BigDecimal getDiscountPrice() {
        return discountPrice;
    }

    public CategoryEntity getCategory() {
        return category;
    }

    public BrandEntity getBrand() {
        return brand;
    }

    public ProductStatus getStatus() {
        return status;
    }

    public boolean isFeatured() {
        return featured;
    }

    public int getStockQuantity() { return stockQuantity; }
    public int getLowStockThreshold() { return lowStockThreshold; }
    public boolean isMembershipDiscountEligible() { return membershipDiscountEligible; }
    public boolean isNewProduct() { return newProduct; }
    public boolean isActive() { return active; }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public List<ProductImageEntity> getImages() {
        return Collections.unmodifiableList(images);
    }
}
