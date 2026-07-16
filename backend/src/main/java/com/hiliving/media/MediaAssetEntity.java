package com.hiliving.media;

import com.hiliving.identity.user.persistence.UserEntity;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "media_assets")
class MediaAssetEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "storage_provider", nullable = false, length = 20) private String storageProvider;
    @Column(name = "storage_key", nullable = false, unique = true, length = 500) private String storageKey;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private MediaPurpose purpose;
    @Column(name = "original_filename", nullable = false, length = 255) private String originalFilename;
    @Column(name = "content_type", nullable = false, length = 100) private String contentType;
    @Column(name = "size_bytes", nullable = false) private long sizeBytes;
    @Column(nullable = false) private int width;
    @Column(nullable = false) private int height;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "created_by_user_id", nullable = false) private UserEntity createdBy;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "deleted_at") private Instant deletedAt;

    protected MediaAssetEntity() { }

    static MediaAssetEntity local(String key, MediaPurpose purpose, String originalFilename, ProcessedImage image, UserEntity creator) {
        MediaAssetEntity asset = new MediaAssetEntity();
        asset.storageProvider = "LOCAL";
        asset.storageKey = key;
        asset.purpose = purpose;
        asset.originalFilename = originalFilename;
        asset.contentType = image.contentType();
        asset.sizeBytes = image.sizeBytes();
        asset.width = image.width();
        asset.height = image.height();
        asset.createdBy = creator;
        return asset;
    }

    @PrePersist void create() { createdAt = Instant.now(); }
    Long getId() { return id; }
    String getStorageKey() { return storageKey; }
    String getOriginalFilename() { return originalFilename; }
    String getContentType() { return contentType; }
    long getSizeBytes() { return sizeBytes; }
    int getWidth() { return width; }
    int getHeight() { return height; }
}
