-- ============================================================================
-- GebyaNet Products Migration Script
-- Purpose: Migrate products.sql to align with backend schema
-- - Remove 'productfor' column (no longer needed with quantity limits)
-- - Add seller_id, min_order_qty, max_order_qty, sell_unit columns
-- - Add random quantity limitations to existing products
-- - Ensure compatibility with Sequelize backend
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ============================================================================
-- STEP 1: Alter table structure to match backend model
-- ============================================================================

-- Check if table exists and drop if needed (for clean migration)
-- DROP TABLE IF EXISTS `products`;

-- Add new columns if they don't exist
ALTER TABLE `products` 
  ADD COLUMN IF NOT EXISTS `seller_id` INT NOT NULL DEFAULT 1 AFTER `seller_email`,
  ADD COLUMN IF NOT EXISTS `min_order_qty` FLOAT NOT NULL DEFAULT 1 AFTER `seller_id`,
  ADD COLUMN IF NOT EXISTS `max_order_qty` FLOAT DEFAULT NULL AFTER `min_order_qty`,
  ADD COLUMN IF NOT EXISTS `sell_unit` ENUM('piece','dozen','kg','quintal','box','liter','meter','pack','pair') NOT NULL DEFAULT 'kg' AFTER `max_order_qty`;

-- Remove productfor column (replaced by quantity limits)
ALTER TABLE `products` DROP COLUMN IF EXISTS `productfor`;

-- ============================================================================
-- STEP 2: Update existing products with random quantity limitations
-- ============================================================================

-- Update products with random min/max quantities based on their unit type
-- For kg-based products (most vegetables/spices)
UPDATE `products` 
SET 
  `min_order_qty` = CASE 
    WHEN `catItems` = '7' AND `subcat` IN ('5', '6', '7') THEN FLOOR(0.5 + (RAND() * 2)) -- 0.5-2.5 kg min
    WHEN `catItems` = '7' AND `subcat` IN ('11', '15') THEN FLOOR(0.1 + (RAND() * 0.4)) -- 0.1-0.5 kg for spices
    WHEN `catItems` = '7' AND `subcat` = '8' THEN 1 -- 1 piece min for eggs
    ELSE 1
  END,
  `max_order_qty` = CASE 
    WHEN `catItems` = '7' AND `subcat` IN ('5', '6', '7') THEN FLOOR(10 + (RAND() * 40)) -- 10-50 kg max
    WHEN `catItems` = '7' AND `subcat` IN ('11', '15') THEN FLOOR(2 + (RAND() * 8)) -- 2-10 kg max for spices
    WHEN `catItems` = '7' AND `subcat` = '8' THEN FLOOR(30 + (RAND() * 70)) -- 30-100 pieces for eggs
    WHEN `catItems` = '7' AND `subcat` IN ('9', '12') THEN FLOOR(5 + (RAND() * 20)) -- 5-25 kg for grains/pasta
    ELSE 50
  END,
  `sell_unit` = CASE
    WHEN `unit_of_measurement` LIKE '%ኪሎ%' OR `unit_of_measurement` LIKE '%kg%' OR `size` LIKE '%ኪሎ%' OR `size` LIKE '%Kilo%' THEN 'kg'
    WHEN `unit_of_measurement` LIKE '%ፍሬ%' OR `size` LIKE '%ፍሬ%' OR `title` LIKE '%እንቁላል%' THEN 'piece'
    WHEN `unit_of_measurement` LIKE '%ግራም%' OR `unit_of_measurement` LIKE '%gm%' THEN 'kg'
    WHEN `unit_of_measurement` LIKE '%liter%' THEN 'liter'
    WHEN `title` LIKE '%dozen%' THEN 'dozen'
    ELSE 'kg'
  END
WHERE `id` > 0;

-- ============================================================================
-- STEP 3: Create seller_id mapping (map seller_email to user IDs)
-- ============================================================================

-- Update seller_id based on seller_email
-- Assuming you have a users table with sellers
UPDATE `products` p
LEFT JOIN `users` u ON p.`seller_email` = u.`email`
SET p.`seller_id` = COALESCE(u.`id`, 1)
WHERE p.`id` > 0;

-- If users table doesn't exist yet, set default seller_id
-- UPDATE `products` SET `seller_id` = 1 WHERE `seller_id` IS NULL OR `seller_id` = 0;

-- ============================================================================
-- STEP 4: Clean up and optimize data
-- ============================================================================

-- Fix null unit_of_measurement
UPDATE `products` 
SET `unit_of_measurement` = `sell_unit`
WHERE `unit_of_measurement` = 'null' OR `unit_of_measurement` IS NULL;

-- Ensure all JSON fields are valid
UPDATE `products` 
SET `image` = '[]' 
WHERE `image` IS NULL OR `image` = '' OR `image` = 'null';

UPDATE `products` 
SET `color_options` = '[]' 
WHERE `color_options` IS NULL OR `color_options` = '' OR `color_options` = 'null';

UPDATE `products` 
SET `variations` = '[]' 
WHERE `variations` IS NULL OR `variations` = '' OR `variations` = 'null';

UPDATE `products` 
SET `location_prices` = '{"Addis Ababa": ' || CAST(`price` AS CHAR) || '}' 
WHERE `location_prices` = '{}' OR `location_prices` IS NULL;

UPDATE `products` 
SET `location_stock` = '{"Addis Ababa": "in_stock"}' 
WHERE `location_stock` = '{}' OR `location_stock` IS NULL;

-- ============================================================================
-- STEP 5: Add indexes for better performance
-- ============================================================================

-- Add index on seller_id for faster queries
CREATE INDEX IF NOT EXISTS `idx_seller_id` ON `products` (`seller_id`);

-- Add index on status for filtering
CREATE INDEX IF NOT EXISTS `idx_status` ON `products` (`status`);

-- Add index on stock for availability queries
CREATE INDEX IF NOT EXISTS `idx_stock` ON `products` (`stock`);

-- Add index on category and subcategory
CREATE INDEX IF NOT EXISTS `idx_category` ON `products` (`catItems`, `subcat`);

-- Add index on location_name for location-based queries
CREATE INDEX IF NOT EXISTS `idx_location` ON `products` (`location_name`);

-- ============================================================================
-- STEP 6: Verify migration
-- ============================================================================

-- Show sample of migrated data
SELECT 
  `id`,
  `title`,
  `seller_email`,
  `seller_id`,
  `min_order_qty`,
  `max_order_qty`,
  `sell_unit`,
  `price`,
  `stock`,
  `status`
FROM `products`
LIMIT 10;

-- Show column structure
DESCRIBE `products`;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run this script on your database
-- 2. Verify the data looks correct
-- 3. Update your backend to use the new schema
-- 4. Test product creation/updates through the API
-- ============================================================================
