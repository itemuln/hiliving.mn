package com.hiliving.media;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "hiliving.media")
public record MediaProperties(String storagePath) {
    public MediaProperties {
        if (storagePath == null || storagePath.isBlank()) throw new IllegalArgumentException("Media storage path is required");
    }
}
