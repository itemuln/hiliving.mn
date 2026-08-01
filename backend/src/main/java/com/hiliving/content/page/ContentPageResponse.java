package com.hiliving.content.page;

import java.time.Instant;

public record ContentPageResponse(
        Long id,
        String slug,
        String navigationLabel,
        String title,
        String contentHtml,
        boolean published,
        int sortOrder,
        Instant createdAt,
        Instant updatedAt
) {
    static ContentPageResponse from(ContentPageEntity page) {
        return new ContentPageResponse(
                page.getId(),
                page.getSlug(),
                page.getNavigationLabel(),
                page.getTitle(),
                page.getContentHtml(),
                page.isPublished(),
                page.getDisplayOrder(),
                page.getCreatedAt(),
                page.getUpdatedAt()
        );
    }
}
