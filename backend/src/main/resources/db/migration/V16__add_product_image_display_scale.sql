ALTER TABLE product_images
    ADD COLUMN display_scale INTEGER NOT NULL DEFAULT 100,
    ADD CONSTRAINT product_images_display_scale_range
        CHECK (display_scale BETWEEN 75 AND 150);
