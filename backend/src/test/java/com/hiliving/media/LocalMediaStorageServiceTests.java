package com.hiliving.media;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class LocalMediaStorageServiceTests {
    @TempDir Path temporary;

    @Test
    void configurableStorageUsesServerPurposeUniqueNamesAndCannotDeleteOutsideRoot() throws Exception {
        Path root = temporary.resolve("external-root");
        Path source = temporary.resolve("original-name.png");
        Files.write(source, new byte[]{1, 2, 3});
        LocalMediaStorageService storage = new LocalMediaStorageService(new MediaProperties(root.toString()));
        String first = storage.store(source, MediaPurpose.PRODUCT, "png");
        String second = storage.store(source, MediaPurpose.PRODUCT, "png");
        assertThat(first).startsWith("products/").endsWith(".png").doesNotContain("original-name");
        assertThat(second).isNotEqualTo(first);
        assertThat(Files.readAllBytes(root.resolve(first))).containsExactly(1, 2, 3);
        storage.delete("../original-name.png");
        assertThat(source).exists();
        storage.delete(first);
        assertThat(root.resolve(first)).doesNotExist();
    }

    @Test
    void databaseFailureRemovesTheNewlyStoredFile() throws Exception {
        Path root = temporary.resolve("rollback-root");
        LocalMediaStorageService storage = new LocalMediaStorageService(new MediaProperties(root.toString()));
        ImageProcessor processor = new ImageProcessor();
        var assets = org.mockito.Mockito.mock(MediaAssetRepository.class);
        var users = org.mockito.Mockito.mock(com.hiliving.identity.user.persistence.UserRepository.class);
        var audit = org.mockito.Mockito.mock(com.hiliving.admin.audit.AuditService.class);
        var transactions = org.mockito.Mockito.mock(org.springframework.transaction.support.TransactionTemplate.class);
        var creator = org.mockito.Mockito.mock(com.hiliving.identity.user.persistence.UserEntity.class);
        org.mockito.Mockito.when(users.findByEmail("admin@example.com")).thenReturn(java.util.Optional.of(creator));
        org.mockito.Mockito.when(transactions.execute(org.mockito.ArgumentMatchers.any())).thenThrow(new RuntimeException("database failed"));
        MediaService service = new MediaService(processor, storage, assets, users, audit, transactions);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.upload(png(), MediaPurpose.PRODUCT, "admin@example.com"))
                .hasMessage("database failed");
        if (Files.exists(root)) try (var paths = Files.walk(root)) { assertThat(paths.filter(Files::isRegularFile)).isEmpty(); }
    }

    private MockMultipartFile png() throws Exception {
        BufferedImage image = new BufferedImage(10, 10, BufferedImage.TYPE_INT_ARGB);
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();ImageIO.write(image, "PNG", bytes);
        return new MockMultipartFile("file", "image.png", "image/png", bytes.toByteArray());
    }
}
