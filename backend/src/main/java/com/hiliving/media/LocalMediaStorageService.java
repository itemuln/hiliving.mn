package com.hiliving.media;

import com.hiliving.api.error.ApiRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class LocalMediaStorageService implements MediaStorageService {
    private final Path root;

    public LocalMediaStorageService(MediaProperties properties) {
        this.root = Path.of(properties.storagePath()).toAbsolutePath().normalize();
    }

    @Override
    public String store(Path processedFile, MediaPurpose purpose, String extension) {
        Path staging = null;
        try {
            Path safeRoot = prepareRoot();
            Path directory = safeRoot.resolve(purpose.directory()).normalize();
            if (!directory.startsWith(safeRoot)) throw storageFailure();
            Files.createDirectories(directory);
            if (Files.isSymbolicLink(directory)) throw storageFailure();

            String filename = UUID.randomUUID() + "." + extension;
            Path target = directory.resolve(filename).normalize();
            if (!target.startsWith(directory) || Files.exists(target, LinkOption.NOFOLLOW_LINKS)) throw storageFailure();

            staging = directory.resolve("." + filename + ".tmp").normalize();
            Files.copy(processedFile, staging, StandardCopyOption.COPY_ATTRIBUTES);
            try {
                Files.move(staging, target, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException exception) {
                Files.move(staging, target);
            }
            return purpose.directory() + "/" + filename;
        } catch (IOException | SecurityException exception) {
            throw storageFailure();
        } finally {
            if (staging != null) {
                try { Files.deleteIfExists(staging); } catch (IOException ignored) { }
            }
        }
    }

    @Override
    public void delete(String storageKey) {
        if (storageKey == null || storageKey.isBlank() || Path.of(storageKey).isAbsolute()) return;
        try {
            Path safeRoot = prepareRoot();
            Path target = safeRoot.resolve(storageKey).normalize();
            if (target.startsWith(safeRoot)) Files.deleteIfExists(target);
        } catch (IOException | SecurityException ignored) {
            // Cleanup is best-effort; the original safe failure remains authoritative.
        }
    }

    Path root() { return root; }

    private Path prepareRoot() throws IOException {
        Files.createDirectories(root);
        if (Files.isSymbolicLink(root)) throw new IOException("Media root must not be a symbolic link");
        return root.toRealPath(LinkOption.NOFOLLOW_LINKS).normalize();
    }

    private ApiRequestException storageFailure() {
        return new ApiRequestException(HttpStatus.INTERNAL_SERVER_ERROR, "MEDIA_STORAGE_FAILED", "The image could not be stored");
    }
}
