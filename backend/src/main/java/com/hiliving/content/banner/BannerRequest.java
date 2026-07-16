package com.hiliving.content.banner;
import jakarta.validation.constraints.*; import java.time.Instant;
public record BannerRequest(@NotBlank @Size(max=180) String title,@Size(max=500) String subtitle,@NotBlank @Size(max=2048) String imageUrl,@Size(max=2048) String mobileImageUrl,@Size(max=2048) String linkUrl,@Size(max=100) String linkLabel,@Min(0) int sortOrder,boolean active,Instant startsAt,Instant endsAt){}
