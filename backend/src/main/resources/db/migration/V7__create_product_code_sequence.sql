CREATE SEQUENCE product_code_sequence
    AS BIGINT
    INCREMENT BY 1
    MINVALUE 1
    START WITH 1;

SELECT setval(
    'product_code_sequence',
    COALESCE(
        (
            SELECT MAX(SUBSTRING(product_code FROM '^PRD-([0-9]+)$')::BIGINT)
            FROM products
            WHERE product_code ~ '^PRD-[0-9]{1,18}$'
        ),
        0
    ) + 1,
    FALSE
);
