package com.hiliving.content.banner;
import java.time.Instant;
public record BannerResponse(Long id,String title,String subtitle,String imageUrl,String mobileImageUrl,String linkUrl,String linkLabel,int sortOrder,boolean active,Instant startsAt,Instant endsAt,Instant createdAt,Instant updatedAt){static BannerResponse from(BannerEntity b){return new BannerResponse(b.getId(),b.getTitle(),b.getSubtitle(),b.getImageUrl(),b.getMobileImageUrl(),b.getLinkUrl(),b.getLinkLabel(),b.getDisplayOrder(),b.isActive(),b.getStartsAt(),b.getEndsAt(),b.getCreatedAt(),b.getUpdatedAt());}}
