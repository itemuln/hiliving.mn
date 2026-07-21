ALTER TABLE orders
    ADD COLUMN customer_email_snapshot VARCHAR(254),
    ADD COLUMN customer_first_name_snapshot VARCHAR(100);

UPDATE orders order_record
SET customer_email_snapshot = customer.email,
    customer_first_name_snapshot = customer.first_name
FROM users customer
WHERE customer.id = order_record.customer_id;

ALTER TABLE orders
    ALTER COLUMN customer_email_snapshot SET NOT NULL,
    ALTER COLUMN customer_first_name_snapshot SET NOT NULL,
    ADD CONSTRAINT orders_customer_email_snapshot_not_blank CHECK (char_length(btrim(customer_email_snapshot)) > 3),
    ADD CONSTRAINT orders_customer_first_name_snapshot_not_blank CHECK (char_length(btrim(customer_first_name_snapshot)) > 0);
