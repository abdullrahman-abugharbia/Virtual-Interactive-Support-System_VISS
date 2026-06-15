INSERT INTO categories (value, label, description)
VALUES
  ('smartphones', 'Smartphones', 'Mobile devices and smartphones'),
  ('laptops', 'Laptops', 'Laptops and notebooks'),
  ('fragrances', 'Fragrances', 'Perfume and scent products'),
  ('skincare', 'Skincare', 'Beauty and skincare products')
ON CONFLICT (value) DO NOTHING;

INSERT INTO users (email, password_hash, name, role, addresses)
VALUES
  (
    'admin@example.com',
    crypt('Admin@123', gen_salt('bf')),
    'Admin User',
    'admin',
    '[]'::jsonb
  ),
  (
    'customer@example.com',
    crypt('User@1234', gen_salt('bf')),
    'Customer User',
    'user',
    '[]'::jsonb
  )
ON CONFLICT (email) DO NOTHING;

INSERT INTO carts (user_id)
SELECT u.id
FROM users u
LEFT JOIN carts c ON c.user_id = u.id
WHERE c.id IS NULL;

WITH cte AS (
  SELECT id, value FROM categories
)
INSERT INTO products (
  title,
  description,
  price,
  discount_percentage,
  discount_price,
  rating,
  stock,
  brand,
  category_id,
  thumbnail,
  images,
  highlights,
  colors,
  sizes,
  deleted
)
VALUES
  (
    'iPhone 15 Pro',
    'Premium Apple smartphone with powerful camera and fast chip.',
    1299,
    7,
    1208.07,
    4.7,
    25,
    'Apple',
    (SELECT id FROM cte WHERE value = 'smartphones'),
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1592286927505-1def25115558?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1603891128711-11b4b03bb138?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["A17-class performance", "Pro camera system", "Long battery life", "5G connectivity"]'::jsonb,
    '[{"name":"Black","class":"bg-gray-900","selectedClass":"ring-gray-900"},{"name":"Silver","class":"bg-gray-200","selectedClass":"ring-gray-300"}]'::jsonb,
    '[{"name":"128GB","inStock":true,"id":"128gb"},{"name":"256GB","inStock":true,"id":"256gb"},{"name":"512GB","inStock":true,"id":"512gb"}]'::jsonb,
    false
  ),
  (
    'Galaxy S24',
    'Samsung flagship smartphone with dynamic AMOLED display.',
    1099,
    8,
    1011.08,
    4.5,
    40,
    'Samsung',
    (SELECT id FROM cte WHERE value = 'smartphones'),
    'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1533228100845-08145b01de14?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1583573636246-18cb2246697f?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["120Hz display", "Fast charging", "Night photography", "Dual SIM"]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    false
  ),
  (
    'MacBook Air M3',
    'Thin and light laptop with Apple silicon performance.',
    1499,
    10,
    1349.10,
    4.8,
    18,
    'Apple',
    (SELECT id FROM cte WHERE value = 'laptops'),
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["M3 chip", "All-day battery", "Retina display", "Fanless design"]'::jsonb,
    '[{"name":"Silver","class":"bg-gray-200","selectedClass":"ring-gray-300"}]'::jsonb,
    '[{"name":"13-inch","inStock":true,"id":"13in"},{"name":"15-inch","inStock":true,"id":"15in"}]'::jsonb,
    false
  ),
  (
    'HP Pavilion 15',
    'Balanced performance laptop for work and entertainment.',
    999,
    12,
    879.12,
    4.3,
    30,
    'HP',
    (SELECT id FROM cte WHERE value = 'laptops'),
    'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1593642633279-1796119d5482?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["Intel i7", "16GB RAM", "512GB SSD", "Backlit keyboard"]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    false
  ),
  (
    'Royal Mirage Perfume',
    'Long-lasting fragrance with premium notes.',
    120,
    15,
    102,
    4.1,
    100,
    'Royal Mirage',
    (SELECT id FROM cte WHERE value = 'fragrances'),
    'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["Premium blend", "Unisex", "Travel-safe bottle", "Long wear"]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    false
  )
ON CONFLICT DO NOTHING;
