package com.hiliving.media;

import com.hiliving.admin.audit.AuditService;
import com.hiliving.api.error.ApiRequestException;
import com.hiliving.identity.user.persistence.UserEntity;
import com.hiliving.identity.user.persistence.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;

@Service
class MediaService {
    private final ImageProcessor processor;
    private final MediaStorageService storage;
    private final MediaAssetRepository assets;
    private final UserRepository users;
    private final AuditService audit;
    private final TransactionTemplate transactions;

    MediaService(ImageProcessor processor, MediaStorageService storage, MediaAssetRepository assets,
                 UserRepository users, AuditService audit, TransactionTemplate transactions) {
        this.processor = processor;
        this.storage = storage;
        this.assets = assets;
        this.users = users;
        this.audit = audit;
        this.transactions = transactions;
    }

    MediaUploadResponse upload(MultipartFile file, MediaPurpose purpose, String username) {
        UserEntity creator = users.findByEmail(username).orElseThrow(() ->
                new ApiRequestException(HttpStatus.UNAUTHORIZED, "AUTHENTICATION_REQUIRED", "Authentication is required"));
        ProcessedImage image = processor.process(file, purpose);
        String key = null;
        try {
            key = storage.store(image.path(), purpose, image.extension());
            String storedKey = key;
            MediaAssetEntity asset = transactions.execute(status -> {
                MediaAssetEntity saved = assets.saveAndFlush(MediaAssetEntity.local(
                        storedKey, purpose, safeOriginalFilename(file.getOriginalFilename()), image, creator));
                audit.record("MEDIA_UPLOADED", "MEDIA", saved.getId(),
                        purpose + ";" + image.contentType() + ";" + image.sizeBytes());
                return saved;
            });
            if (asset == null) throw new IllegalStateException("Media transaction did not complete");
            return new MediaUploadResponse(asset.getId(), key, "/media/" + key, asset.getOriginalFilename(),
                    asset.getContentType(), asset.getSizeBytes(), asset.getWidth(), asset.getHeight());
        } catch (RuntimeException exception) {
            if (key != null) storage.delete(key);
            throw exception;
        } finally {
            try { Files.deleteIfExists(image.path()); } catch (IOException ignored) { }
        }
    }

    private String safeOriginalFilename(String original) {
        String value = original == null ? "image" : original.replace('\\', '/');
        value = value.substring(value.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}]", "").trim();
        if (value.isBlank()) value = "image";
        return value.substring(0, Math.min(value.length(), 255));
    }
}
