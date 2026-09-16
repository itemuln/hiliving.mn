package com.hiliving.content.banner;

import com.hiliving.admin.audit.AuditService;
import com.hiliving.api.error.ApiRequestException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;
import java.util.Objects;

@Service
public class BannerService {
    private final BannerRepository banners;
    private final AuditService audit;
    private final Clock clock = Clock.systemUTC();

    public BannerService(BannerRepository banners, AuditService audit) {
        this.banners = banners;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<BannerResponse> publicList(BannerPlacement placement) {
        return banners.findPublic(clock.instant(), placement).stream()
                .map(BannerResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BannerResponse> adminList() {
        return banners.findAll(Sort.by("displayOrder", "id")).stream()
                .map(BannerResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public BannerResponse find(Long id) {
        return BannerResponse.from(require(id));
    }

    @Transactional
    public BannerResponse create(BannerRequest request) {
        validate(request);
        BannerEntity banner = banners.saveAndFlush(BannerEntity.create(request));
        audit.record("BANNER_CREATED", "BANNER", banner.getId(), banner.getTitle());
        return BannerResponse.from(banner);
    }

    @Transactional
    public BannerResponse update(Long id, BannerRequest request) {
        validate(request);
        BannerEntity banner = require(id);
        boolean wasActive = banner.isActive();
        boolean imageChanged = !Objects.equals(banner.getImageUrl(), clean(request.imageUrl()))
                || !Objects.equals(banner.getMobileImageUrl(), clean(request.mobileImageUrl()));

        banner.update(request);
        banners.flush();

        String action = wasActive && !request.active() ? "BANNER_DEACTIVATED" : "BANNER_UPDATED";
        audit.record(action, "BANNER", id, banner.getTitle());
        if (imageChanged) {
            audit.record("BANNER_IMAGE_CHANGED", "BANNER", id, null);
        }
        return BannerResponse.from(banner);
    }

    @Transactional
    public void delete(Long id) {
        BannerEntity banner = require(id);
        banners.delete(banner);
        audit.record("BANNER_DELETED", "BANNER", id, banner.getTitle());
    }

    private void validate(BannerRequest request) {
        if (request.startsAt() != null
                && request.endsAt() != null
                && !request.endsAt().isAfter(request.startsAt())) {
            throw new ApiRequestException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Banner end time must be after start time"
            );
        }

        String linkUrl = clean(request.linkUrl());
        if (linkUrl != null
                && !linkUrl.startsWith("/")
                && !linkUrl.startsWith("https://")
                && !linkUrl.startsWith("http://")) {
            throw new ApiRequestException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Banner link must be an internal path or HTTP URL"
            );
        }
    }

    private BannerEntity require(Long id) {
        return banners.findById(id).orElseThrow(() -> new ApiRequestException(
                HttpStatus.NOT_FOUND,
                "BANNER_NOT_FOUND",
                "Banner was not found"
        ));
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
