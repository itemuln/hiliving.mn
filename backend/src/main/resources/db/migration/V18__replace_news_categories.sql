ALTER TABLE news
    DROP CONSTRAINT news_category_valid;

UPDATE news
SET category = CASE
    WHEN category = 'EDUCATION' THEN 'TRAINING'
    WHEN category = 'GENERAL' THEN 'NEWS'
    ELSE 'INFORMATION'
END;

ALTER TABLE news
    ADD CONSTRAINT news_category_valid CHECK (
        category IN ('TRAINING', 'NEWS', 'INFORMATION')
    );
