ALTER TABLE banners
    ADD COLUMN placement VARCHAR(20) NOT NULL DEFAULT 'HERO',
    ADD CONSTRAINT banners_placement_valid CHECK (placement IN ('HERO', 'PROMOTIONAL'));

DROP INDEX banners_public_idx;
CREATE INDEX banners_public_placement_idx
    ON banners (placement, display_order, id)
    WHERE active;

ALTER TABLE brands
    ADD COLUMN banner_image_url VARCHAR(2048),
    ADD CONSTRAINT brands_banner_image_url_not_blank CHECK (
        banner_image_url IS NULL OR char_length(btrim(banner_image_url)) > 0
    );
