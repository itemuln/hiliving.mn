package com.hiliving.content.banner;

import java.time.Instant;

public record BannerResponse(
        Long id,
        String title,
        String subtitle,
        String imageUrl,
        String mobileImageUrl,
        String linkUrl,
        String linkLabel,
        BannerPlacement placement,
        int sortOrder,
        boolean active,
        Instant startsAt,
        Instant endsAt,
        Instant createdAt,
        Instant updatedAt
) {
    static BannerResponse from(BannerEntity banner) {
        return new BannerResponse(
                banner.getId(),
                banner.getTitle(),
                banner.getSubtitle(),
                banner.getImageUrl(),
                banner.getMobileImageUrl(),
                banner.getLinkUrl(),
                banner.getLinkLabel(),
                banner.getPlacement(),
                banner.getDisplayOrder(),
                banner.isActive(),
                banner.getStartsAt(),
                banner.getEndsAt(),
                banner.getCreatedAt(),
                banner.getUpdatedAt()
        );
    }
}
