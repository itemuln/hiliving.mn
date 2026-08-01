ALTER TABLE news
    ADD COLUMN category VARCHAR(32) NOT NULL DEFAULT 'GENERAL';

ALTER TABLE news
    ALTER COLUMN category DROP DEFAULT,
    ADD CONSTRAINT news_category_valid CHECK (
        category IN (
            'GENERAL',
            'ECONOMY',
            'BUSINESS',
            'SOCIETY',
            'HEALTH',
            'EDUCATION',
            'LIFESTYLE'
        )
    );
