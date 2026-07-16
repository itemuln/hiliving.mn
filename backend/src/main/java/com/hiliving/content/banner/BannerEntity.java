package com.hiliving.content.banner;

import jakarta.persistence.*; import java.time.Instant;

@Entity @Table(name="banners")
public class BannerEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false,length=180) private String title; @Column(length=500) private String subtitle;
    @Column(name="image_url",nullable=false,length=2048) private String imageUrl; @Column(name="mobile_image_url",length=2048) private String mobileImageUrl;
    @Column(name="link_url",length=2048) private String linkUrl; @Column(name="link_label",length=100) private String linkLabel;
    @Column(name="display_order",nullable=false) private int displayOrder; @Column(nullable=false) private boolean active;
    @Column(name="starts_at") private Instant startsAt; @Column(name="ends_at") private Instant endsAt;
    @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt; @Column(name="updated_at",nullable=false) private Instant updatedAt;
    protected BannerEntity(){} public static BannerEntity create(BannerRequest r){BannerEntity b=new BannerEntity();b.update(r);return b;}
    public void update(BannerRequest r){title=r.title().trim();subtitle=clean(r.subtitle());imageUrl=r.imageUrl().trim();mobileImageUrl=clean(r.mobileImageUrl());linkUrl=clean(r.linkUrl());linkLabel=clean(r.linkLabel());displayOrder=r.sortOrder();active=r.active();startsAt=r.startsAt();endsAt=r.endsAt();}
    @PrePersist void create(){createdAt=Instant.now();updatedAt=createdAt;}@PreUpdate void updateTime(){updatedAt=Instant.now();}
    private static String clean(String v){return v==null||v.isBlank()?null:v.trim();}
    public Long getId(){return id;}public String getTitle(){return title;}public String getSubtitle(){return subtitle;}public String getImageUrl(){return imageUrl;}public String getMobileImageUrl(){return mobileImageUrl;}public String getLinkUrl(){return linkUrl;}public String getLinkLabel(){return linkLabel;}public int getDisplayOrder(){return displayOrder;}public boolean isActive(){return active;}public Instant getStartsAt(){return startsAt;}public Instant getEndsAt(){return endsAt;}public Instant getCreatedAt(){return createdAt;}public Instant getUpdatedAt(){return updatedAt;}
}
