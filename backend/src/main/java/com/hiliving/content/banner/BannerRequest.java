package com.hiliving.content.banner;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record BannerRequest(
        @NotBlank @Size(max = 180) String title,
        @Size(max = 500) String subtitle,
        @NotBlank @Size(max = 2048) String imageUrl,
        @Size(max = 2048) String mobileImageUrl,
        @Size(max = 2048) String linkUrl,
        @Size(max = 100) String linkLabel,
        @NotNull BannerPlacement placement,
        @Min(0) int sortOrder,
        boolean active,
        Instant startsAt,
        Instant endsAt
) {
}
