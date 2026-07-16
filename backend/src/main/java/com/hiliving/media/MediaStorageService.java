package com.hiliving.media;

import java.nio.file.Path;

public interface MediaStorageService {
    String store(Path processedFile, MediaPurpose purpose, String extension);
    void delete(String storageKey);
}
