package com.hiliving.content.page;

import com.hiliving.admin.audit.AuditService;
import com.hiliving.api.error.ApiRequestException;
import com.hiliving.content.HtmlContentSanitizer;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class ContentPageService {
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");
    private static final Pattern IMAGE_WITH_SOURCE_PATTERN = Pattern.compile(
            "<img\\b[^>]*\\bsrc\\s*=\\s*[\"'][^\"']+[\"']",
            Pattern.CASE_INSENSITIVE
    );

    private final ContentPageRepository pages;
    private final HtmlContentSanitizer sanitizer;
    private final AuditService audit;

    public ContentPageService(
            ContentPageRepository pages,
            HtmlContentSanitizer sanitizer,
            AuditService audit
    ) {
        this.pages = pages;
        this.sanitizer = sanitizer;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<ContentPageResponse> publicList() {
        return pages.findAllByPublishedTrueOrderByDisplayOrderAsc().stream()
                .map(ContentPageResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ContentPageResponse publicFind(String slug) {
        return ContentPageResponse.from(pages.findBySlugAndPublishedTrue(slug).orElseThrow(
                () -> new ApiRequestException(HttpStatus.NOT_FOUND, "PAGE_NOT_FOUND", "Content page was not found")
        ));
    }

    @Transactional(readOnly = true)
    public List<ContentPageResponse> adminList() {
        return pages.findAllByOrderByDisplayOrderAsc().stream()
                .map(ContentPageResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ContentPageResponse find(Long id) {
        return ContentPageResponse.from(require(id));
    }

    @Transactional
    public ContentPageResponse update(Long id, ContentPageRequest request) {
        ContentPageEntity page = require(id);
        boolean wasPublished = page.isPublished();
        String safeHtml = sanitizer.sanitize(request.contentHtml());
        if (request.published() && !hasContent(safeHtml)) {
            throw new ApiRequestException(
                    HttpStatus.BAD_REQUEST,
                    "PAGE_CONTENT_REQUIRED",
                    "Published pages must contain text or an image"
            );
        }
        page.update(request.title(), safeHtml, request.published());
        pages.flush();

        String action = !wasPublished && request.published()
                ? "PAGE_PUBLISHED"
                : wasPublished && !request.published() ? "PAGE_UNPUBLISHED" : "PAGE_UPDATED";
        audit.record(action, "PAGE", id, page.getSlug());
        return ContentPageResponse.from(page);
    }

    private ContentPageEntity require(Long id) {
        return pages.findById(id).orElseThrow(
                () -> new ApiRequestException(HttpStatus.NOT_FOUND, "PAGE_NOT_FOUND", "Content page was not found")
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
}
