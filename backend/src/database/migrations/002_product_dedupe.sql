-- Deduplicate products that accumulated from non-idempotent seeding, then
-- enforce uniqueness so the seed files' "ON CONFLICT DO NOTHING" actually
-- prevents future duplicates. Non-destructive: keeps the lowest-id row per
-- (title, brand) and repoints cart/order references to it.

CREATE TEMP TABLE _product_dupes ON COMMIT DROP AS
SELECT p.id AS dup_id, k.keep_id
FROM products p
JOIN (
  SELECT title, brand, MIN(id) AS keep_id
  FROM products
  GROUP BY title, brand
) k ON k.title = p.title AND k.brand = p.brand
WHERE p.id <> k.keep_id;

-- Resolve cart_items UNIQUE(cart_id, product_id) collisions before repointing.
DELETE FROM cart_items ci
USING _product_dupes d
WHERE ci.product_id = d.dup_id
  AND EXISTS (
    SELECT 1 FROM cart_items keep
    WHERE keep.cart_id = ci.cart_id AND keep.product_id = d.keep_id
  );

UPDATE cart_items ci
SET product_id = d.keep_id
FROM _product_dupes d
WHERE ci.product_id = d.dup_id;

-- Order line items keep their own snapshots, but repoint for referential tidiness.
UPDATE order_items oi
SET product_id = d.keep_id
FROM _product_dupes d
WHERE oi.product_id = d.dup_id;

-- Remove the duplicate product rows.
DELETE FROM products p
USING _product_dupes d
WHERE p.id = d.dup_id;

-- Enforce uniqueness (guarded so it is safe on fresh installs and re-runs).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_title_brand_unique'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_title_brand_unique UNIQUE (title, brand);
  END IF;
END $$;
