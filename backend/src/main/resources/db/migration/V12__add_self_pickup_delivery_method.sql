ALTER TABLE orders DROP CONSTRAINT orders_delivery_method_valid;

ALTER TABLE orders ADD CONSTRAINT orders_delivery_method_valid CHECK (
    delivery_method IN ('STANDARD_DELIVERY', 'SELF_PICKUP')
);
