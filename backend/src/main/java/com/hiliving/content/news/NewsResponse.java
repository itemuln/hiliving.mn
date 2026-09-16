package com.hiliving.content.news;

import java.time.Instant;

public record NewsResponse(
        Long id,
        String title,
        String slug,
        NewsCategory category,
        String content,
        String thumbnailUrl,
        boolean published,
        Instant publishedAt,
        int sortOrder,
        Instant createdAt,
        Instant updatedAt
) {
    static NewsResponse from(NewsEntity news, String content) {
        return new NewsResponse(
                news.getId(),
                news.getTitle(),
                news.getSlug(),
                news.getCategory(),
                content,
                news.getThumbnailUrl(),
                news.isPublished(),
                news.getPublishedAt(),
                news.getDisplayOrder(),
                news.getCreatedAt(),
                news.getUpdatedAt()
        );
    }
}
