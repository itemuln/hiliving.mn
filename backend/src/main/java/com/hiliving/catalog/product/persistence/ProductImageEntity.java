package com.hiliving.catalog.product.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

@Entity
@Table(name = "product_images")
public class ProductImageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private ProductEntity product;

    @NotBlank
    @Size(max = 2048)
    @Column(name = "image_url", nullable = false, length = 2048)
    private String imageUrl;

    @Size(max = 255)
    @Column(name = "alt_text", length = 255)
    private String altText;

    @Min(0)
    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "primary_image", nullable = false)
    private boolean primaryImage;

    @Min(75)
    @Max(150)
    @Column(name = "display_scale", nullable = false)
    private int displayScale;

    @NotNull
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ProductImageEntity() {
    }

    private ProductImageEntity(
            ProductEntity product,
            String imageUrl,
            String altText,
            int displayOrder,
            boolean primaryImage,
            int displayScale
    ) {
        this.product = product;
        this.imageUrl = imageUrl;
        this.altText = altText;
        this.displayOrder = displayOrder;
        this.primaryImage = primaryImage;
        this.displayScale = displayScale;
    }

    static ProductImageEntity create(
            ProductEntity product,
            String imageUrl,
            String altText,
            int displayOrder,
            boolean primaryImage,
            int displayScale
    ) {
        return new ProductImageEntity(product, imageUrl, altText, displayOrder, primaryImage, displayScale);
    }

    public static ProductImageEntity draft(String imageUrl, String altText, int displayOrder, boolean primaryImage,
                                           int displayScale) {
        return new ProductImageEntity(null, imageUrl, altText, displayOrder, primaryImage, displayScale);
    }

    static ProductImageEntity copyFor(ProductEntity product, ProductImageEntity image) {
        return create(product, image.imageUrl, image.altText, image.displayOrder, image.primaryImage,
                image.displayScale);
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getAltText() {
        return altText;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public boolean isPrimaryImage() {
        return primaryImage;
    }

    public int getDisplayScale() {
        return displayScale;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
