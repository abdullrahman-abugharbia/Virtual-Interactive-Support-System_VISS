-- Extra categories
INSERT INTO categories (value, label, description)
VALUES
  ('tablets', 'Tablets', 'Tablets and iPads'),
  ('headphones', 'Headphones', 'Headphones and earbuds'),
  ('cameras', 'Cameras', 'Digital cameras and accessories'),
  ('gaming', 'Gaming', 'Gaming consoles and accessories'),
  ('tvs', 'TVs', 'Televisions and home cinema'),
  ('watches', 'Watches', 'Smart and classic watches')
ON CONFLICT (value) DO NOTHING;

-- Smartphones
INSERT INTO products (title, description, price, discount_percentage, discount_price, rating, stock, brand, category_id, thumbnail, images, highlights, colors, sizes, deleted)
VALUES
  (
    'iPhone 14',
    'Apple iPhone 14 with A15 Bionic chip and improved cameras.',
    999, 10, 899.10, 4.5, 50, 'Apple',
    (SELECT id FROM categories WHERE value = 'smartphones'),
    'https://images.unsplash.com/photo-1664478546384-d57ffe74a78c?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1664478546384-d57ffe74a78c?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["A15 Bionic chip","Dual camera","5G","All-day battery"]'::jsonb,
    '[{"name":"Midnight","class":"bg-gray-900","selectedClass":"ring-gray-900"},{"name":"Starlight","class":"bg-gray-100","selectedClass":"ring-gray-200"},{"name":"Blue","class":"bg-blue-500","selectedClass":"ring-blue-500"}]'::jsonb,
    '[{"name":"128GB","inStock":true,"id":"128gb"},{"name":"256GB","inStock":true,"id":"256gb"},{"name":"512GB","inStock":false,"id":"512gb"}]'::jsonb,
    false
  ),
  (
    'Samsung Galaxy A54',
    'Mid-range Samsung with great display and long battery life.',
    449, 5, 426.55, 4.3, 80, 'Samsung',
    (SELECT id FROM categories WHERE value = 'smartphones'),
    'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["Super AMOLED display","5000mAh battery","50MP camera","5G ready"]'::jsonb,
    '[{"name":"Black","class":"bg-gray-900","selectedClass":"ring-gray-900"},{"name":"White","class":"bg-white","selectedClass":"ring-gray-200"}]'::jsonb,
    '[{"name":"128GB","inStock":true,"id":"128gb"},{"name":"256GB","inStock":true,"id":"256gb"}]'::jsonb,
    false
  ),
  (
    'Google Pixel 8',
    'Google flagship with advanced AI camera features.',
    699, 8, 643.08, 4.6, 35, 'Google',
    (SELECT id FROM categories WHERE value = 'smartphones'),
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["Tensor G3 chip","Magic Eraser","7 years updates","Temperature sensor"]'::jsonb,
    '[{"name":"Obsidian","class":"bg-gray-900","selectedClass":"ring-gray-900"},{"name":"Hazel","class":"bg-green-700","selectedClass":"ring-green-700"}]'::jsonb,
    '[{"name":"128GB","inStock":true,"id":"128gb"},{"name":"256GB","inStock":true,"id":"256gb"}]'::jsonb,
    false
  ),
  (
    'OnePlus 12',
    'Flagship killer with Snapdragon 8 Gen 3 and 100W charging.',
    799, 12, 703.12, 4.4, 45, 'OnePlus',
    (SELECT id FROM categories WHERE value = 'smartphones'),
    'https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["Snapdragon 8 Gen 3","100W SuperVOOC","Hasselblad camera","5400mAh battery"]'::jsonb,
    '[{"name":"Silky Black","class":"bg-gray-900","selectedClass":"ring-gray-900"},{"name":"Flowy Emerald","class":"bg-emerald-600","selectedClass":"ring-emerald-600"}]'::jsonb,
    '[{"name":"256GB","inStock":true,"id":"256gb"},{"name":"512GB","inStock":true,"id":"512gb"}]'::jsonb,
    false
  ),

-- Laptops
  (
    'Dell XPS 15',
    'Premium laptop with OLED display and Intel Core i9.',
    1899, 8, 1747.08, 4.7, 15, 'Dell',
    (SELECT id FROM categories WHERE value = 'laptops'),
    'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["OLED 4K display","Intel Core i9","32GB RAM","NVIDIA RTX 4060"]'::jsonb,
    '[{"name":"Platinum Silver","class":"bg-gray-300","selectedClass":"ring-gray-300"}]'::jsonb,
    '[{"name":"512GB","inStock":true,"id":"512gb"},{"name":"1TB","inStock":true,"id":"1tb"}]'::jsonb,
    false
  ),
  (
    'Lenovo ThinkPad X1 Carbon',
    'Business ultrabook with legendary ThinkPad durability.',
    1599, 10, 1439.10, 4.6, 20, 'Lenovo',
    (SELECT id FROM categories WHERE value = 'laptops'),
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["Intel Core i7","16GB RAM","MIL-SPEC durability","All-day battery"]'::jsonb,
    '[{"name":"Black","class":"bg-gray-900","selectedClass":"ring-gray-900"}]'::jsonb,
    '[{"name":"512GB","inStock":true,"id":"512gb"},{"name":"1TB","inStock":true,"id":"1tb"}]'::jsonb,
    false
  ),
  (
    'ASUS ROG Zephyrus G14',
    'Compact gaming laptop with AMD Ryzen 9 and RTX 4060.',
    1399, 7, 1301.07, 4.5, 22, 'ASUS',
    (SELECT id FROM categories WHERE value = 'laptops'),
    'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["AMD Ryzen 9","RTX 4060","14-inch QHD 165Hz","MUX Switch"]'::jsonb,
    '[{"name":"Eclipse Gray","class":"bg-gray-700","selectedClass":"ring-gray-700"},{"name":"Platinum White","class":"bg-gray-100","selectedClass":"ring-gray-200"}]'::jsonb,
    '[{"name":"512GB","inStock":true,"id":"512gb"},{"name":"1TB","inStock":true,"id":"1tb"}]'::jsonb,
    false
  ),

-- Tablets
  (
    'iPad Pro 12.9"',
    'The most powerful iPad with M2 chip and Liquid Retina XDR.',
    1099, 5, 1044.05, 4.8, 28, 'Apple',
    (SELECT id FROM categories WHERE value = 'tablets'),
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["M2 chip","Liquid Retina XDR","Thunderbolt","Face ID"]'::jsonb,
    '[{"name":"Space Gray","class":"bg-gray-700","selectedClass":"ring-gray-700"},{"name":"Silver","class":"bg-gray-200","selectedClass":"ring-gray-300"}]'::jsonb,
    '[{"name":"128GB","inStock":true,"id":"128gb"},{"name":"256GB","inStock":true,"id":"256gb"},{"name":"512GB","inStock":true,"id":"512gb"},{"name":"1TB","inStock":true,"id":"1tb"}]'::jsonb,
    false
  ),
  (
    'Samsung Galaxy Tab S9',
    'Premium Android tablet with AMOLED display and S Pen.',
    799, 8, 735.08, 4.5, 33, 'Samsung',
    (SELECT id FROM categories WHERE value = 'tablets'),
    'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["Dynamic AMOLED 2X","S Pen included","IP68 water resistant","Snapdragon 8 Gen 2"]'::jsonb,
    '[{"name":"Graphite","class":"bg-gray-800","selectedClass":"ring-gray-800"},{"name":"Beige","class":"bg-yellow-100","selectedClass":"ring-yellow-200"}]'::jsonb,
    '[{"name":"128GB","inStock":true,"id":"128gb"},{"name":"256GB","inStock":true,"id":"256gb"}]'::jsonb,
    false
  ),

-- Headphones
  (
    'Sony WH-1000XM5',
    'Industry-leading noise canceling headphones with 30hr battery.',
    349, 15, 296.65, 4.8, 60, 'Sony',
    (SELECT id FROM categories WHERE value = 'headphones'),
    'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["Industry-best ANC","30hr battery","Multipoint connection","Crystal clear calls"]'::jsonb,
    '[{"name":"Black","class":"bg-gray-900","selectedClass":"ring-gray-900"},{"name":"Silver","class":"bg-gray-300","selectedClass":"ring-gray-300"}]'::jsonb,
    '[]'::jsonb,
    false
  ),
  (
    'Apple AirPods Pro (2nd Gen)',
    'Active noise cancellation with Adaptive Audio and USB-C.',
    249, 10, 224.10, 4.7, 75, 'Apple',
    (SELECT id FROM categories WHERE value = 'headphones'),
    'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["Adaptive Audio","H2 chip","USB-C charging","30hr total with case"]'::jsonb,
    '[{"name":"White","class":"bg-white","selectedClass":"ring-gray-200"}]'::jsonb,
    '[]'::jsonb,
    false
  ),
  (
    'Bose QuietComfort 45',
    'Comfortable over-ear headphones with excellent noise cancellation.',
    279, 12, 245.52, 4.5, 45, 'Bose',
    (SELECT id FROM categories WHERE value = 'headphones'),
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["QuietComfort ANC","24hr battery","TriPort acoustic","USB-C charging"]'::jsonb,
    '[{"name":"Black","class":"bg-gray-900","selectedClass":"ring-gray-900"},{"name":"White Smoke","class":"bg-gray-100","selectedClass":"ring-gray-200"}]'::jsonb,
    '[]'::jsonb,
    false
  ),
  (
    'Samsung Galaxy Buds2 Pro',
    'Hi-Fi sound with intelligent ANC in a compact form.',
    229, 10, 206.10, 4.4, 55, 'Samsung',
    (SELECT id FROM categories WHERE value = 'headphones'),
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["Hi-Fi 24bit audio","Intelligent ANC","360 Audio","IPX7 water resistant"]'::jsonb,
    '[{"name":"Graphite","class":"bg-gray-800","selectedClass":"ring-gray-800"},{"name":"White","class":"bg-white","selectedClass":"ring-gray-200"},{"name":"Bora Purple","class":"bg-purple-400","selectedClass":"ring-purple-400"}]'::jsonb,
    '[]'::jsonb,
    false
  ),

-- Cameras
  (
    'Sony Alpha A7 IV',
    'Full-frame mirrorless camera with 33MP and 4K video.',
    2499, 5, 2374.05, 4.8, 12, 'Sony',
    (SELECT id FROM categories WHERE value = 'cameras'),
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["33MP full-frame sensor","4K 60fps video","Real-time tracking AF","5-axis IBIS"]'::jsonb,
    '[{"name":"Black","class":"bg-gray-900","selectedClass":"ring-gray-900"}]'::jsonb,
    '[]'::jsonb,
    false
  ),
  (
    'Canon EOS R50',
    'Compact mirrorless camera perfect for content creators.',
    679, 8, 624.68, 4.5, 25, 'Canon',
    (SELECT id FROM categories WHERE value = 'cameras'),
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["24.2MP APS-C","4K video","Dual Pixel CMOS AF","Compact design"]'::jsonb,
    '[{"name":"Black","class":"bg-gray-900","selectedClass":"ring-gray-900"},{"name":"White","class":"bg-white","selectedClass":"ring-gray-200"}]'::jsonb,
    '[]'::jsonb,
    false
  ),

-- Gaming
  (
    'PlayStation 5',
    'Sony next-gen console with ultra-high speed SSD and 4K gaming.',
    499, 0, 499, 4.9, 10, 'Sony',
    (SELECT id FROM categories WHERE value = 'gaming'),
    'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["4K gaming","120fps support","Ultra-HD Blu-ray","DualSense haptic feedback"]'::jsonb,
    '[{"name":"White","class":"bg-white","selectedClass":"ring-gray-200"}]'::jsonb,
    '[]'::jsonb,
    false
  ),
  (
    'Xbox Series X',
    'Microsoft most powerful console ever with 12 teraflops.',
    499, 0, 499, 4.8, 14, 'Microsoft',
    (SELECT id FROM categories WHERE value = 'gaming'),
    'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["12 teraflops GPU","4K 120fps","Quick Resume","Xbox Game Pass ready"]'::jsonb,
    '[{"name":"Black","class":"bg-gray-900","selectedClass":"ring-gray-900"}]'::jsonb,
    '[]'::jsonb,
    false
  ),
  (
    'Nintendo Switch OLED',
    'Hybrid gaming console with vibrant OLED screen.',
    349, 0, 349, 4.7, 30, 'Nintendo',
    (SELECT id FROM categories WHERE value = 'gaming'),
    'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["7-inch OLED screen","Tabletop & TV mode","64GB storage","Wide adjustable stand"]'::jsonb,
    '[{"name":"White","class":"bg-white","selectedClass":"ring-gray-200"},{"name":"Neon","class":"bg-red-500","selectedClass":"ring-red-500"}]'::jsonb,
    '[]'::jsonb,
    false
  ),

-- TVs
  (
    'LG C3 65" OLED TV',
    'Award-winning OLED TV with perfect blacks and 120Hz.',
    1799, 15, 1529.15, 4.9, 8, 'LG',
    (SELECT id FROM categories WHERE value = 'tvs'),
    'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["OLED evo panel","Dolby Vision & Atmos","120Hz VRR","webOS 23"]'::jsonb,
    '[{"name":"Black","class":"bg-gray-900","selectedClass":"ring-gray-900"}]'::jsonb,
    '[{"name":"55\"","inStock":true,"id":"55"},{"name":"65\"","inStock":true,"id":"65"},{"name":"77\"","inStock":true,"id":"77"}]'::jsonb,
    false
  ),
  (
    'Samsung Neo QLED 4K 55"',
    'Quantum Mini LEDs for precise local dimming and vivid colors.',
    1299, 10, 1169.10, 4.6, 15, 'Samsung',
    (SELECT id FROM categories WHERE value = 'tvs'),
    'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["Neo QLED","Quantum HDR 32x","Motion Xcelerator 144Hz","Tizen OS"]'::jsonb,
    '[{"name":"Black","class":"bg-gray-900","selectedClass":"ring-gray-900"}]'::jsonb,
    '[{"name":"55\"","inStock":true,"id":"55"},{"name":"65\"","inStock":true,"id":"65"}]'::jsonb,
    false
  ),

-- Watches
  (
    'Apple Watch Series 9',
    'The most advanced Apple Watch with S9 chip and Double Tap.',
    399, 5, 379.05, 4.7, 40, 'Apple',
    (SELECT id FROM categories WHERE value = 'watches'),
    'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["S9 chip","Double Tap gesture","Always-On Retina","Carbon neutral option"]'::jsonb,
    '[{"name":"Midnight","class":"bg-gray-900","selectedClass":"ring-gray-900"},{"name":"Starlight","class":"bg-yellow-50","selectedClass":"ring-yellow-100"},{"name":"Red","class":"bg-red-500","selectedClass":"ring-red-500"}]'::jsonb,
    '[{"name":"41mm","inStock":true,"id":"41mm"},{"name":"45mm","inStock":true,"id":"45mm"}]'::jsonb,
    false
  ),
  (
    'Samsung Galaxy Watch 6',
    'Advanced health tracking with BioActive Sensor and Wear OS.',
    299, 10, 269.10, 4.4, 50, 'Samsung',
    (SELECT id FROM categories WHERE value = 'watches'),
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["BioActive Sensor","Sleep coaching","Sapphire crystal glass","40hr battery"]'::jsonb,
    '[{"name":"Graphite","class":"bg-gray-800","selectedClass":"ring-gray-800"},{"name":"Gold","class":"bg-yellow-400","selectedClass":"ring-yellow-400"},{"name":"Silver","class":"bg-gray-300","selectedClass":"ring-gray-300"}]'::jsonb,
    '[{"name":"40mm","inStock":true,"id":"40mm"},{"name":"44mm","inStock":true,"id":"44mm"}]'::jsonb,
    false
  ),
  (
    'Garmin Fenix 7',
    'Rugged multisport GPS watch for outdoor adventurers.',
    699, 8, 643.08, 4.6, 25, 'Garmin',
    (SELECT id FROM categories WHERE value = 'watches'),
    'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["Multi-band GPS","18 day battery","Topographic maps","Health snapshot"]'::jsonb,
    '[{"name":"Black","class":"bg-gray-900","selectedClass":"ring-gray-900"},{"name":"Silver","class":"bg-gray-300","selectedClass":"ring-gray-300"}]'::jsonb,
    '[{"name":"47mm","inStock":true,"id":"47mm"},{"name":"51mm","inStock":true,"id":"51mm"}]'::jsonb,
    false
  ),

-- Skincare
  (
    'CeraVe Moisturizing Cream',
    'Developed with dermatologists, for normal to dry skin.',
    18, 5, 17.10, 4.7, 200, 'CeraVe',
    (SELECT id FROM categories WHERE value = 'skincare'),
    'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["Hyaluronic Acid","3 essential ceramides","Non-comedogenic","Fragrance-free"]'::jsonb,
    '[]'::jsonb,
    '[{"name":"16 oz","inStock":true,"id":"16oz"},{"name":"19 oz","inStock":true,"id":"19oz"}]'::jsonb,
    false
  ),
  (
    'The Ordinary Niacinamide 10%',
    'High-strength vitamin and mineral blemish formula.',
    8, 0, 8, 4.5, 300, 'The Ordinary',
    (SELECT id FROM categories WHERE value = 'skincare'),
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["10% Niacinamide","1% Zinc","Reduces blemishes","Vegan formula"]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    false
  ),

-- Fragrances
  (
    'Dior Sauvage EDT',
    'Fresh and powerful fragrance inspired by wide-open spaces.',
    89, 0, 89, 4.8, 120, 'Dior',
    (SELECT id FROM categories WHERE value = 'fragrances'),
    'https://images.unsplash.com/photo-1541643600914-78b084683702?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1541643600914-78b084683702?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["Top: Bergamot","Heart: Sichuan pepper","Base: Ambroxan","Long lasting"]'::jsonb,
    '[]'::jsonb,
    '[{"name":"60ml","inStock":true,"id":"60ml"},{"name":"100ml","inStock":true,"id":"100ml"},{"name":"200ml","inStock":true,"id":"200ml"}]'::jsonb,
    false
  ),
  (
    'Chanel Bleu de Chanel',
    'Aromatic-woody fragrance for the modern man.',
    149, 0, 149, 4.9, 90, 'Chanel',
    (SELECT id FROM categories WHERE value = 'fragrances'),
    'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=600&q=80',
    '["https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["Citrus & aromatic","Woody base","Iconic blue bottle","Eau de Parfum"]'::jsonb,
    '[]'::jsonb,
    '[{"name":"50ml","inStock":true,"id":"50ml"},{"name":"100ml","inStock":true,"id":"100ml"},{"name":"150ml","inStock":true,"id":"150ml"}]'::jsonb,
    false
  )
ON CONFLICT DO NOTHING;
