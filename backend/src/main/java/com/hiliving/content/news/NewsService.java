package com.hiliving.content.news;

import com.hiliving.admin.audit.AuditService;
import com.hiliving.api.error.ApiRequestException;
import com.hiliving.content.HtmlContentSanitizer;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.regex.Pattern;

@Service
public class NewsService {
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");
    private static final Pattern IMAGE_WITH_SOURCE_PATTERN = Pattern.compile(
            "<img\\b[^>]*\\bsrc\\s*=\\s*[\"'][^\"']+[\"']",
            Pattern.CASE_INSENSITIVE
    );

    private final NewsRepository news;
    private final NewsIdentifierGenerator identifiers;
    private final AuditService audit;
    private final HtmlContentSanitizer sanitizer;
    private final Clock clock = Clock.systemUTC();

    public NewsService(
            NewsRepository news,
            NewsIdentifierGenerator identifiers,
            AuditService audit,
            HtmlContentSanitizer sanitizer
    ) {
        this.news = news;
        this.identifiers = identifiers;
        this.audit = audit;
        this.sanitizer = sanitizer;
    }

    @Transactional(readOnly = true)
    public List<NewsResponse> publicList() {
        return news.findPublic(clock.instant()).stream().map(this::response).toList();
    }

    @Transactional(readOnly = true)
    public NewsResponse publicFind(String slug) {
        return response(news.findPublicBySlug(slug, clock.instant()).orElseThrow(
                () -> new ApiRequestException(HttpStatus.NOT_FOUND, "NEWS_NOT_FOUND", "News article was not found")
        ));
    }

    @Transactional(readOnly = true)
    public List<NewsResponse> adminList(String search) {
        String query = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        return news.findAll(Sort.by(Sort.Direction.DESC, "updatedAt").and(Sort.by(Sort.Direction.DESC, "id")))
                .stream()
                .filter(item -> query.isEmpty() || item.getTitle().toLowerCase(Locale.ROOT).contains(query))
                .map(this::response)
                .toList();
    }

    @Transactional(readOnly = true)
    public NewsResponse find(Long id) {
        return response(require(id));
    }

    @Transactional
    public NewsResponse create(NewsRequest request) {
        NewsRequest safeRequest = sanitize(request);
        String slug = identifiers.uniqueSlug(safeRequest.title());
        NewsEntity item = news.saveAndFlush(NewsEntity.create(safeRequest, slug));
        audit.record(safeRequest.published() ? "NEWS_PUBLISHED" : "NEWS_CREATED", "NEWS", item.getId(), item.getSlug());
        return response(item);
    }

    @Transactional
    public NewsResponse update(Long id, NewsRequest request) {
        NewsRequest safeRequest = sanitize(request);
        NewsEntity item = require(id);
        boolean wasPublished = item.isPublished();
        boolean thumbnailChanged = !Objects.equals(item.getThumbnailUrl(), clean(safeRequest.thumbnailUrl()));
        item.update(safeRequest);
        news.flush();
        String action = !wasPublished && safeRequest.published()
                ? "NEWS_PUBLISHED"
                : wasPublished && !safeRequest.published() ? "NEWS_UNPUBLISHED" : "NEWS_UPDATED";
        audit.record(action, "NEWS", id, item.getSlug());
        if (thumbnailChanged) audit.record("NEWS_THUMBNAIL_CHANGED", "NEWS", id, null);
        return response(item);
    }

    @Transactional
    public void delete(Long id) {
        NewsEntity item = require(id);
        news.delete(item);
        audit.record("NEWS_DELETED", "NEWS", id, item.getSlug());
    }

    private NewsRequest sanitize(NewsRequest request) {
        String safeContent = sanitizer.sanitize(request.content());
        if (!hasContent(safeContent)) {
            throw new ApiRequestException(
                    HttpStatus.BAD_REQUEST,
                    "NEWS_CONTENT_REQUIRED",
                    "News content must contain text or an image"
            );
        }
        return new NewsRequest(
                request.title(),
                request.category(),
                safeContent,
                request.thumbnailUrl(),
                request.published(),
                request.publishedAt()
        );
    }

    private NewsResponse response(NewsEntity item) {
        return NewsResponse.from(item, sanitizer.sanitize(item.getContent()));
    }

    private NewsEntity require(Long id) {
        return news.findById(id).orElseThrow(
                () -> new ApiRequestException(HttpStatus.NOT_FOUND, "NEWS_NOT_FOUND", "News article was not found")
        );
    }

    private boolean hasContent(String html) {
        if (IMAGE_WITH_SOURCE_PATTERN.matcher(html).find()) return true;
        String text = HTML_TAG_PATTERN.matcher(html).replaceAll("")
                .replace("&nbsp;", " ")
                .replace("&#160;", " ")
                .trim();
        return !text.isBlank();
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
