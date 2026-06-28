-- Products can belong to EXTRA categories beyond their primary category_id, via a
-- tags[] array holding category values. This lets, e.g., a laptop also live under
-- "gaming" without losing its primary "laptops" category.
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- Tag the two gaming laptops so they appear under "gaming" as well as "laptops".
UPDATE products
SET tags = ARRAY['gaming']
WHERE title IN ('Lenovo ThinkPad X1 Carbon', 'ASUS ROG Zephyrus G14');
