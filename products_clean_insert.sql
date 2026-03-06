-- ============================================================================
-- GebyaNet Products - Clean Insert Script
-- Compatible with backend schema (no productfor, with quantity limits)
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ============================================================================
-- Insert products with random quantity limitations
-- Note: seller_id defaults to 1, update after users are created
-- ============================================================================

INSERT INTO `products` (
  `id`, `title`, `color`, `size`, `brand`, `price`, `description`, 
  `catItems`, `subcat`, `seller_email`, `seller_id`, 
  `min_order_qty`, `max_order_qty`, `sell_unit`,
  `image`, `created_at`, `updated_at`, `unit_of_measurement`, 
  `status`, `stock`, `location_prices`, `sku`, `location_type`, 
  `location_name`, `coordinates`, `location_radius`, `location_stock`, 
  `color_options`, `variations`
) VALUES
-- Vegetables & Fruits
(23, 'ብርቱካን', 'Yelew', 'Kilo', 'ከገበሬ', 230, 'አንደኛ ደረጃ ጣፋጭ ብርቱካን', '7', '6', 'kalu4mom@gmail.com', 1, 1, 25, 'kg', '[\"/uploads/1736852320855-IMG_20250114_135826_662.jpg.webp\"]', '2025-01-06 08:59:09', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":210}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(24, 'ነጭ ሽንኩርት', 'ነጭ', 'ኪሎ', 'በላይ አትክልትና አስቤዛ', 200, 'ደረቅ አደኛ ደረጃ', '7', '5', 'kasahunmeba@gmail.com', 1, 0.5, 30, 'kg', '[\"/uploads/1736592097625-585b77b02308bf6fff48d251ab397674.jpg.webp\"]', '2025-01-11 10:41:38', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":301}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(26, 'ሀበሻ ማንጎ', 'ቢጫ', 'ኪሎ', 'በላይ አትክልትና አስቤዛ', 70, 'በላይ አትክልትና አስቤዛ', '7', '6', 'kasahunmeba@gmail.com', 1, 1, 20, 'kg', '[\"/uploads/1736592639859-4b46d4038d15d0c821ad77f32d7c0144.jpg.webp\"]', '2025-01-11 10:50:41', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":80}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(28, 'ቀይ ተልባ', 'የለውም', 'ኪሎ', 'በላይ አትክልትና አስቤዛ', 360, 'በላይ አትክልትና አስቤዛ', '7', '7', 'kasahunmeba@gmail.com', 1, 1, 15, 'kg', '[\"/uploads/1736593251056-d3bdb0b470bab77966627f56d75391d9.jpg.webp\"]', '2025-01-11 11:00:52', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":280}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(29, 'ልዩ ክክ የሀገር ውስጥ ምስር ክክ', 'የለውም', 'ኪሎ', 'በላይ አትክልትና አስቤዛ', 340, 'በላይ አትክልትና አስቤዛ', '7', '12', 'kasahunmeba@gmail.com', 1, 1, 25, 'kg', '[\"/uploads/1736593440845-6960ce41cf453a9ce528a7b9971719e8.jpg.webp\"]', '2025-01-11 11:04:02', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":280}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(32, 'ሀባብ', 'ቀይ', 'ኪሎ', 'በላይ አትክልትና አስቤዛ', 65, 'በላይ አትክልትና አስቤዛ', '7', '6', 'kasahunmeba@gmail.com', 1, 1, 30, 'kg', '[\"/uploads/1736594897594-2b652f53799ca94afa6a7fdadfbd3472.jpg.webp\"]', '2025-01-11 11:28:18', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":65}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(33, 'አተር ክክ የሀገር ውስጥ', 'ንፁ', 'ኪሎ', 'በላይ አትክልትና አስቤዛ', 190, 'በላይ አትክልትና አስቤዛ', '7', '12', 'kasahunmeba@gmail.com', 1, 1, 20, 'kg', '[\"/uploads/1736595150522-96b7edd0a3b223d63d31c2d5b9471bfa.jpg.webp\"]', '2025-01-11 11:32:31', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":190}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(34, 'የሀገር ውስጥ ሩዝ', 'ነጭ', 'ኪሎ', 'በላይ አትክልትና አስቤዛ', 120, 'Fresh Ethiopian rice delivered to your doorstep', '7', '12', 'kasahunmeba@gmail.com', 1, 2, 50, 'kg', '[\"/uploads/1740492606581-IMG_20250224_165802_52.jpg.webp\"]', '2025-01-11 12:11:09', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":125}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(35, 'ለውዝ ጥሬ', 'ንፁ', 'ኪሎ', 'በላይ አትክልትና አስቤዛ', 220, 'በላይ አትክልትና አስቤዛ', '7', '7', 'kasahunmeba@gmail.com', 1, 0.5, 10, 'kg', '[\"/uploads/1736598663394-88944f07d1a8f747cdd27638959b7514.jpg.webp\"]', '2025-01-11 12:31:04', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":185}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(36, 'እንቁላል', 'ነጭ', 'በፍሬ', 'በላይ አትክልትና አስቤዛ', 20, 'በላይ አትክልትና አስቤዛ', '7', '8', 'kasahunmeba@gmail.com', 1, 6, 60, 'piece', '[\"/uploads/1736598855224-179bef3b170c3023314c3b44c2fa78c4.jpg.webp\"]', '2025-01-11 12:34:15', NOW(), 'piece', 'approved', 'in_stock', '{\"Addis Ababa\":17}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(37, 'ራስ ጎባ ዱቄት በኪሎ', 'ነጭ', 'ኪሎ', 'በላይ አትክልትና አስቤዛ', 120, 'ራስ ጎባ ዱቄት', '7', '9', 'kasahunmeba@gmail.com', 1, 1, 25, 'kg', '[\"/uploads/1739261652012-20250206_121441.jpg.webp\"]', '2025-01-11 12:37:21', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":100}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

-- Spices (smaller quantities)
(51, 'በርበሬ1ኛ', 'ቀይ', 'ኪሎ', 'ሙሉ ማዕድ', 1200, 'Premium Ethiopian berbere spice', '7', '15', 'kasahunmeba@gmail.com', 1, 0.25, 5, 'kg', '[\"/uploads/1737016417812-1ff4f719a0a93bdf25ffa88dbbeb0911.jpg.webp\"]', '2025-01-16 08:33:38', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":550}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(55, 'ጦስኝ', 'የለውም', 'ኪሎ', 'በላይ አትክልትና አስቤዛ', 450, 'Fresh Ethiopian spice', '7', '11', 'kasahunmeba@gmail.com', 1, 0.1, 3, 'kg', '[\"/uploads/1737046385118-image_search_1737044297991.jpg.webp\"]', '2025-01-16 16:53:05', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":300}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(56, 'ጥቁር አዝሙድ 1ኛ', 'ጥቁር', 'ኪሎ', 'በላይ አትክልትና አስቤዛ', 900, 'Premium black cumin', '7', '11', 'kasahunmeba@gmail.com', 1, 0.25, 5, 'kg', '[\"/uploads/1737046587487-a2dd91d0f668dccdb75a331096e8f558.jpg.webp\"]', '2025-01-16 16:56:28', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":700}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(57, 'ቆንዶ በርበሬ', 'የለውም', 'ኪሎ', 'በላይ አስቤዛ', 2300, 'Premium dried pepper', '7', '11', 'kasahunmeba@gmail.com', 1, 0.1, 2, 'kg', '[\"/uploads/1737048220602-c98db32b0b1d1051d27ccc4ab252a773.jpg.webp\"]', '2025-01-16 17:23:41', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":2000}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(58, 'ነጭ አዝሙድ', 'ነጭ', 'ኪሎ', 'በላይ አትክልት ና አስቤዛ', 450, 'White cumin seeds', '7', '11', 'kasahunmeba@gmail.com', 1, 0.25, 5, 'kg', '[\"/uploads/1737048469353-image_search_1737043469091.jpg.webp\"]', '2025-01-16 17:27:49', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":310}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(59, 'የተፈጨ እርድ', 'ቢጫ', '100 ግራም', 'በላይ አትክልትና አስቤዛ', 100, 'Ground turmeric powder', '7', '11', 'kasahunmeba@gmail.com', 1, 0.1, 2, 'kg', '[\"/uploads/1737048779347-6ed6702dda631c0d25a565f6f88fa3c9.jpg.webp\"]', '2025-01-16 17:33:00', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":115}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(60, 'ጥሬ እርድ', 'የለውም', 'ኪሎ', 'በላይ አትክልትና አስቤዛ', 190, 'Raw turmeric root', '7', '11', 'kasahunmeba@gmail.com', 1, 0.5, 10, 'kg', '[\"/uploads/1737049191820-image_search_1737049047338.webp.webp\"]', '2025-01-16 17:39:52', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":190}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(61, 'በሶብላ', 'የለውም', 'ኪሎ', 'በላይ አትክልትና አስቤዛ', 500, 'Ethiopian fenugreek', '7', '11', 'kasahunmeba@gmail.com', 1, 0.25, 5, 'kg', '[\"/uploads/1740491701568-IMG_20250224_165410_407.jpg.webp\"]', '2025-01-16 17:43:45', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":230}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(62, 'አዝመሪኖ', 'የለውም', 'በኪሎ', 'በላይ አትክልትና አስቤዛ', 400, 'Ethiopian rosemary', '7', '11', 'kasahunmeba@gmail.com', 1, 0.1, 3, 'kg', '[\"/uploads/1740491585619-IMG_20250224_165400_413.jpg.webp\"]', '2025-01-16 17:46:48', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":130}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(65, 'የተፈለፈለ ኮረሪማ', 'የለውም', 'ኪሎ', 'በላይ አትክልትና አስቤዛ', 4300, 'Premium Ethiopian cardamom', '7', '11', 'kasahunmeba@gmail.com', 1, 0.1, 2, 'kg', '[\"/uploads/1737050371543-image_search_1737044459563.jpg.webp\"]', '2025-01-16 17:59:31', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":3300}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

-- Packaged goods
(52, 'መኮረኒ', 'የለውም', 'ኪሎ', 'በላይ አትክልትና አስቤዛ', 135, 'Macaroni pasta', '7', '9', 'kasahunmeba@gmail.com', 1, 1, 20, 'kg', '[\"/uploads/1737016674695-5218294abf9f81cfd7f4032ae2a12c5e.jpg.webp\"]', '2025-01-16 08:37:55', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":120}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(53, 'ፕሪማ ፓስታ', 'የለው', 'ኪሎ', 'ፕሪማ ፓስታ', 100, 'Prima pasta', '7', '9', 'kasahunmeba@gmail.com', 1, 1, 25, 'kg', '[\"/uploads/1740216182586-20250206_115058.jpg.webp\"]', '2025-01-16 08:40:54', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":90}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(63, 'ማር 1 ኪሎ', 'none', 'kg', 'Belay', 280, 'Pure Ethiopian honey', '7', '9', 'kalu4mom@gmail.com', 1, 0.5, 10, 'kg', '[\"/uploads/1740571940951-IMG_20250224_172108_78.jpg.webp\"]', '2025-01-16 17:54:49', NOW(), 'kg', 'approved', 'in_stock', '{\"Addis Ababa\":230}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]'),

(64, 'ኮርን ፍሌክስ ትልቅ', 'none', 'gm', 'factory', 270, 'Corn flakes breakfast cereal', '7', '9', 'kalu4mom@gmail.com', 1, 1, 10, 'pack', '[\"/uploads/1740409399914-Screenshot_20250224_180143_Google.jpg.webp\"]', '2025-01-16 17:57:34', NOW(), 'pack', 'approved', 'in_stock', '{\"Addis Ababa\":230}', NULL, 'region', 'Addis Ababa', ST_GeomFromText('POINT(38.74 9.03)'), 10, '{\"Addis Ababa\":\"in_stock\"}', '[]', '[]');

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check inserted products
SELECT COUNT(*) as total_products FROM `products`;

-- Show products with quantity limits
SELECT 
  `id`, 
  `title`, 
  `min_order_qty`, 
  `max_order_qty`, 
  `sell_unit`, 
  `price`
FROM `products`
ORDER BY `id`
LIMIT 10;

-- ============================================================================
-- NOTES:
-- 1. All products have random min/max quantity limits
-- 2. productfor column removed (replaced by quantity limits)
-- 3. seller_id defaults to 1 - update after creating users
-- 4. All products set to 'approved' status for immediate availability
-- 5. Coordinates use ST_GeomFromText for MySQL GEOMETRY type
-- ============================================================================
