package com.hiliving.media;

import java.nio.file.Path;

record ProcessedImage(Path path, String extension, String contentType, long sizeBytes, int width, int height) { }
