package com.hiliving.content.banner;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "banners")
public class BannerEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(length = 500)
    private String subtitle;

    @Column(name = "image_url", nullable = false, length = 2048)
    private String imageUrl;

    @Column(name = "mobile_image_url", length = 2048)
    private String mobileImageUrl;

    @Column(name = "link_url", length = 2048)
    private String linkUrl;

    @Column(name = "link_label", length = 100)
    private String linkLabel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BannerPlacement placement;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "starts_at")
    private Instant startsAt;

    @Column(name = "ends_at")
    private Instant endsAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected BannerEntity() {
    }

    public static BannerEntity create(BannerRequest request) {
        BannerEntity banner = new BannerEntity();
        banner.update(request);
        return banner;
    }

    public void update(BannerRequest request) {
        title = request.title().trim();
        subtitle = clean(request.subtitle());
        imageUrl = request.imageUrl().trim();
        mobileImageUrl = clean(request.mobileImageUrl());
        linkUrl = clean(request.linkUrl());
        linkLabel = clean(request.linkLabel());
        placement = request.placement();
        displayOrder = request.sortOrder();
        active = request.active();
        startsAt = request.startsAt();
        endsAt = request.endsAt();
    }

    @PrePersist
    void createTimestamps() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void updateTimestamp() {
        updatedAt = Instant.now();
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getSubtitle() {
        return subtitle;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getMobileImageUrl() {
        return mobileImageUrl;
    }

    public String getLinkUrl() {
        return linkUrl;
    }

    public String getLinkLabel() {
        return linkLabel;
    }

    public BannerPlacement getPlacement() {
        return placement;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public boolean isActive() {
        return active;
    }

    public Instant getStartsAt() {
        return startsAt;
    }

    public Instant getEndsAt() {
        return endsAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
