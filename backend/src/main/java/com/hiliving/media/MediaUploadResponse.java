package com.hiliving.media;

public record MediaUploadResponse(
        Long id,
        String storageKey,
        String url,
        String originalFilename,
        String contentType,
        long sizeBytes,
        int width,
        int height
) { }
