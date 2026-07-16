package com.hiliving.media;

public enum MediaPurpose {
    PRODUCT("products", 5L * 1024 * 1024, 4000, 4000, 1600, 1600),
    BRAND("brands", 2L * 1024 * 1024, 3000, 3000, 1000, 1000),
    BANNER("banners", 8L * 1024 * 1024, 6000, 4000, 2400, 1600),
    NEWS("news", 5L * 1024 * 1024, 4000, 3000, 1600, 1200);

    private final String directory;
    private final long maxBytes;
    private final int maxWidth;
    private final int maxHeight;
    private final int outputWidth;
    private final int outputHeight;

    MediaPurpose(String directory, long maxBytes, int maxWidth, int maxHeight, int outputWidth, int outputHeight) {
        this.directory = directory;
        this.maxBytes = maxBytes;
        this.maxWidth = maxWidth;
        this.maxHeight = maxHeight;
        this.outputWidth = outputWidth;
        this.outputHeight = outputHeight;
    }

    public String directory() { return directory; }
    public long maxBytes() { return maxBytes; }
    public int maxWidth() { return maxWidth; }
    public int maxHeight() { return maxHeight; }
    public int outputWidth() { return outputWidth; }
    public int outputHeight() { return outputHeight; }
    public long maxPixels() { return Math.multiplyExact((long) maxWidth, maxHeight); }
}
