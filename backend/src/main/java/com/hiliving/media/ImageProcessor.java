package com.hiliving.media;

import com.hiliving.api.error.ApiRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;
import java.util.Locale;
import java.util.Map;

@Component
class ImageProcessor {
    private static final Map<String, String> CONTENT_TYPES = Map.of("jpg", "image/jpeg", "png", "image/png");

    ProcessedImage process(MultipartFile file, MediaPurpose purpose) {
        if (file == null || file.isEmpty() || file.getSize() <= 0) throw invalid("MEDIA_FILE_EMPTY", "Select a non-empty image file");
        if (file.getSize() > purpose.maxBytes()) throw invalid("MEDIA_FILE_TOO_LARGE", "The image exceeds the size limit for this purpose");

        Path output = null;
        try (ImageInputStream input = ImageIO.createImageInputStream(file.getInputStream())) {
            if (input == null) throw invalid("MEDIA_IMAGE_INVALID", "The file is not a supported image");
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw invalid("MEDIA_IMAGE_INVALID", "The file is not a supported image");
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                String extension = normalizedFormat(reader.getFormatName());
                validateClaims(file, extension);
                int sourceWidth = reader.getWidth(0);
                int sourceHeight = reader.getHeight(0);
                validateDimensions(purpose, sourceWidth, sourceHeight);

                BufferedImage decoded = reader.read(0);
                if (decoded == null) throw invalid("MEDIA_IMAGE_MALFORMED", "The image could not be decoded");
                BufferedImage normalized = resize(decoded, extension, purpose.outputWidth(), purpose.outputHeight());
                output = Files.createTempFile("hiliving-media-", "." + extension);
                if (!ImageIO.write(normalized, extension.equals("jpg") ? "JPEG" : "PNG", output.toFile())) {
                    throw invalid("MEDIA_IMAGE_PROCESSING_FAILED", "The image could not be processed");
                }
                long size = Files.size(output);
                if (size <= 0) throw invalid("MEDIA_IMAGE_PROCESSING_FAILED", "The image could not be processed");
                return new ProcessedImage(output, extension, CONTENT_TYPES.get(extension), size, normalized.getWidth(), normalized.getHeight());
            } finally {
                reader.dispose();
            }
        } catch (ApiRequestException exception) {
            delete(output);
            throw exception;
        } catch (IOException | RuntimeException exception) {
            delete(output);
            throw invalid("MEDIA_IMAGE_MALFORMED", "The image could not be decoded");
        }
    }

    private String normalizedFormat(String format) {
        String value = format.toLowerCase(Locale.ROOT);
        if (value.equals("jpeg") || value.equals("jpg")) return "jpg";
        if (value.equals("png")) return "png";
        throw invalid("MEDIA_FORMAT_UNSUPPORTED", "Only JPEG and PNG images are supported");
    }

    private void validateClaims(MultipartFile file, String actualExtension) {
        String claimedType = file.getContentType();
        if (claimedType == null || !CONTENT_TYPES.get(actualExtension).equalsIgnoreCase(claimedType)) {
            throw invalid("MEDIA_CONTENT_TYPE_MISMATCH", "The declared image type does not match the decoded image");
        }
        String filename = file.getOriginalFilename();
        int dot = filename == null ? -1 : filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) throw invalid("MEDIA_EXTENSION_MISMATCH", "The filename extension does not match the decoded image");
        String claimedExtension = filename.substring(dot + 1).toLowerCase(Locale.ROOT);
        boolean matches = actualExtension.equals("jpg")
                ? claimedExtension.equals("jpg") || claimedExtension.equals("jpeg")
                : claimedExtension.equals("png");
        if (!matches) throw invalid("MEDIA_EXTENSION_MISMATCH", "The filename extension does not match the decoded image");
    }

    private void validateDimensions(MediaPurpose purpose, int width, int height) {
        long pixels;
        try { pixels = Math.multiplyExact((long) width, height); }
        catch (ArithmeticException exception) { throw invalid("MEDIA_DIMENSIONS_EXCEEDED", "The image dimensions are too large"); }
        if (width <= 0 || height <= 0 || width > purpose.maxWidth() || height > purpose.maxHeight() || pixels > purpose.maxPixels()) {
            throw invalid("MEDIA_DIMENSIONS_EXCEEDED", "The image dimensions exceed the limit for this purpose");
        }
    }

    private BufferedImage resize(BufferedImage source, String extension, int maxWidth, int maxHeight) {
        double scale = Math.min(1d, Math.min((double) maxWidth / source.getWidth(), (double) maxHeight / source.getHeight()));
        int width = Math.max(1, (int) Math.round(source.getWidth() * scale));
        int height = Math.max(1, (int) Math.round(source.getHeight() * scale));
        int type = extension.equals("png") ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        BufferedImage output = new BufferedImage(width, height, type);
        Graphics2D graphics = output.createGraphics();
        try {
            if (extension.equals("jpg")) {
                graphics.setColor(Color.WHITE);
                graphics.fillRect(0, 0, width, height);
            }
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.drawImage(source, 0, 0, width, height, null);
        } finally { graphics.dispose(); }
        return output;
    }

    private ApiRequestException invalid(String code, String message) {
        return new ApiRequestException(HttpStatus.BAD_REQUEST, code, message);
    }

    private void delete(Path path) {
        if (path != null) try { Files.deleteIfExists(path); } catch (IOException ignored) { }
    }
}
