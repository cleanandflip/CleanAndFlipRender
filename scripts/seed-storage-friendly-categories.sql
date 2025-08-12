-- Clean & Flip Storage-Friendly Categories Update
-- Focus on 8 core space-efficient, high-turnover items

BEGIN;

-- Clear existing categories
DELETE FROM categories WHERE TRUE;

-- Insert the 8 core storage-friendly categories
INSERT INTO categories (id, name, slug, description, is_active, display_order, image_url, filter_config) VALUES

-- 1. DUMBBELLS - Stack on racks vertically
('cat-dumbbells', 'Dumbbells', 'dumbbells', 
 'Individual pairs and sets, 5lb-75lb range. Space-efficient rack storage.', 
 true, 1, 
 'https://res.cloudinary.com/clean-flip/image/upload/v1/categories/dumbbells.jpg',
 '{"weightRange": {"min": 5, "max": 75}, "storageType": "rack", "condition": ["excellent", "good", "fair"]}'),

-- 2. KETTLEBELLS - Nest together efficiently  
('cat-kettlebells', 'Kettlebells', 'kettlebells',
 'High demand, great margins. 10lb-60lb range. Can stack 20+ in corner.',
 true, 2,
 'https://res.cloudinary.com/clean-flip/image/upload/v1/categories/kettlebells.jpg', 
 '{"weightRange": {"min": 10, "max": 60}, "storageType": "stack", "condition": ["excellent", "good", "fair"]}'),

-- 3. OLYMPIC PLATES - Lay flat or on plate trees
('cat-olympic-plates', 'Weight Plates', 'weight-plates',
 '2.5lb-45lb plates. Sell individually or sets. Vertical plate storage.',
 true, 3,
 'https://res.cloudinary.com/clean-flip/image/upload/v1/categories/weight-plates.jpg',
 '{"plateType": "olympic", "weightRange": {"min": 2.5, "max": 45}, "storageType": "tree"}'),

-- 4. OLYMPIC BARBELLS - Stand vertically in barrel/corner
('cat-barbells', 'Barbells', 'barbells', 
 'Standard 45lb bars, curl bars, trap bars. Vertical storage (9 bars = 2 sq ft).',
 true, 4,
 'https://res.cloudinary.com/clean-flip/image/upload/v1/categories/barbells.jpg',
 '{"barType": ["olympic", "curl", "trap"], "storageType": "vertical", "condition": ["excellent", "good"]}'),

-- 5. ADJUSTABLE DUMBBELLS - High value, small footprint
('cat-adjustable-dumbbells', 'Adjustable Dumbbells', 'adjustable-dumbbells',
 'PowerBlock, Bowflex SelectTech. High value $200-600 resale. Just shelf space.',
 true, 5,
 'https://res.cloudinary.com/clean-flip/image/upload/v1/categories/adjustable-dumbbells.jpg',
 '{"brand": ["powerblock", "bowflex", "ironmaster"], "priceRange": {"min": 200, "max": 600}}'),

-- 6. RESISTANCE BANDS/TRX - Tiny storage footprint
('cat-resistance-bands', 'Resistance & Bands', 'resistance-bands',
 'Bands, TRX, accessories. High margin items. One box/drawer storage.',
 true, 6,
 'https://res.cloudinary.com/clean-flip/image/upload/v1/categories/resistance-bands.jpg',
 '{"type": ["bands", "trx", "suspension", "tubes"], "storageType": "compact"}'),

-- 7. MEDICINE BALLS/SLAM BALLS - Stack in corner/rack
('cat-medicine-balls', 'Medicine Balls', 'medicine-balls',
 '10lb-30lb range. CrossFit crowd favorites. Vertical rack or corner stack.',
 true, 7,
 'https://res.cloudinary.com/clean-flip/image/upload/v1/categories/medicine-balls.jpg',
 '{"ballType": ["medicine", "slam", "wall"], "weightRange": {"min": 10, "max": 30}}'),

-- 8. YOGA/FITNESS MATS - Roll and stand vertically
('cat-mats-accessories', 'Mats & Accessories', 'mats-accessories',
 'Yoga mats, foam rollers, quick sellers. Vertical bin or wall hooks.',
 true, 8,
 'https://res.cloudinary.com/clean-flip/image/upload/v1/categories/mats-accessories.jpg',
 '{"type": ["yoga-mat", "foam-roller", "ab-wheel", "push-up-bars"], "storageType": "vertical"}');

-- Update homepage messaging for storage-friendly focus
UPDATE site_settings 
SET value = 'Quality Fitness Equipment That Fits Your Home'
WHERE key = 'site_tagline';

UPDATE site_settings 
SET value = 'We specialize in space-saving strength training equipment. Dumbbells • Kettlebells • Plates • Barbells • More'
WHERE key = 'site_description';

COMMIT;

-- Verify the new categories
SELECT 
  name,
  slug,
  description,
  display_order,
  filter_config->>'storageType' as storage_type
FROM categories 
ORDER BY display_order;