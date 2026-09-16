package com.hiliving.content.news;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface NewsRepository extends JpaRepository<NewsEntity, Long> {
    @Query("""
            select news
            from NewsEntity news
            where news.published = true
              and (news.publishedAt is null or news.publishedAt <= :now)
            order by coalesce(news.publishedAt, news.createdAt) desc, news.id desc
            """)
    List<NewsEntity> findPublic(@Param("now") Instant now);

    @Query("""
            select news
            from NewsEntity news
            where news.slug = :slug
              and news.published = true
              and (news.publishedAt is null or news.publishedAt <= :now)
            """)
    Optional<NewsEntity> findPublicBySlug(
            @Param("slug") String slug,
            @Param("now") Instant now
    );

    boolean existsBySlug(String slug);

    long countByPublishedTrue();
}
