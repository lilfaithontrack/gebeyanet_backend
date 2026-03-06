-- ============================================================================
-- Apply Product Migration to Localhost
-- Run this on your local gebya_net database
-- ============================================================================

USE gebya_net;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;

-- ============================================================================
-- STEP 1: Backup existing productfor values (optional)
-- ============================================================================
-- CREATE TABLE IF NOT EXISTS products_backup AS SELECT * FROM products;

-- ============================================================================
-- STEP 2: Add new columns
-- ============================================================================

ALTER TABLE `products` 
  ADD COLUMN IF NOT EXISTS `seller_id` INT NOT NULL DEFAULT 1 AFTER `seller_email`,
  ADD COLUMN IF NOT EXISTS `min_order_qty` FLOAT NOT NULL DEFAULT 1 AFTER `seller_id`,
  ADD COLUMN IF NOT EXISTS `max_order_qty` FLOAT DEFAULT NULL AFTER `min_order_qty`,
  ADD COLUMN IF NOT EXISTS `sell_unit` ENUM('piece','dozen','kg','quintal','box','liter','meter','pack','pair') NOT NULL DEFAULT 'kg' AFTER `max_order_qty`;

-- ============================================================================
-- STEP 3: Update products with random quantity limitations
-- ============================================================================

UPDATE `products` 
SET 
  `min_order_qty` = CASE 
    WHEN `catItems` = '7' AND `subcat` IN ('5', '6', '7') THEN 0.5 + (RAND() * 2)
    WHEN `catItems` = '7' AND `subcat` IN ('11', '15') THEN 0.1 + (RAND() * 0.4)
    WHEN `catItems` = '7' AND `subcat` = '8' THEN 1
    WHEN `catItems` = '7' AND `subcat` IN ('9', '12') THEN 1
    ELSE 1
  END,
  `max_order_qty` = CASE 
    WHEN `catItems` = '7' AND `subcat` IN ('5', '6', '7') THEN 10 + (RAND() * 40)
    WHEN `catItems` = '7' AND `subcat` IN ('11', '15') THEN 2 + (RAND() * 8)
    WHEN `catItems` = '7' AND `subcat` = '8' THEN 30 + (RAND() * 70)
    WHEN `catItems` = '7' AND `subcat` IN ('9', '12') THEN 5 + (RAND() * 20)
    ELSE 50
  END,
  `sell_unit` = CASE
    WHEN `unit_of_measurement` LIKE '%ኪሎ%' OR `unit_of_measurement` LIKE '%kg%' OR `size` LIKE '%ኪሎ%' OR `size` LIKE '%Kilo%' THEN 'kg'
    WHEN `unit_of_measurement` LIKE '%ፍሬ%' OR `size` LIKE '%ፍሬ%' OR `title` LIKE '%እንቁላል%' THEN 'piece'
    WHEN `unit_of_measurement` LIKE '%ግራም%' OR `unit_of_measurement` LIKE '%gm%' THEN 'kg'
    WHEN `unit_of_measurement` LIKE '%liter%' THEN 'liter'
    WHEN `title` LIKE '%dozen%' THEN 'dozen'
    ELSE 'kg'
  END,
  `seller_id` = 1
WHERE `id` > 0;

-- ============================================================================
-- STEP 4: Remove productfor column
-- ============================================================================

ALTER TABLE `products` DROP COLUMN IF EXISTS `productfor`;

-- ============================================================================
-- STEP 5: Clean up data
-- ============================================================================

UPDATE `products` 
SET `unit_of_measurement` = `sell_unit`
WHERE `unit_of_measurement` = 'null' OR `unit_of_measurement` IS NULL;

UPDATE `products` 
SET `image` = '[]' 
WHERE `image` IS NULL OR `image` = '' OR `image` = 'null';

UPDATE `products` 
SET `color_options` = '[]' 
WHERE `color_options` IS NULL OR `color_options` = '' OR `color_options` = 'null';

UPDATE `products` 
SET `variations` = '[]' 
WHERE `variations` IS NULL OR `variations` = '' OR `variations` = 'null';

-- ============================================================================
-- STEP 6: Add indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS `idx_seller_id` ON `products` (`seller_id`);
CREATE INDEX IF NOT EXISTS `idx_status` ON `products` (`status`);
CREATE INDEX IF NOT EXISTS `idx_stock` ON `products` (`stock`);
CREATE INDEX IF NOT EXISTS `idx_category` ON `products` (`catItems`, `subcat`);

-- ============================================================================
-- STEP 7: Verify changes
-- ============================================================================

SELECT 
  `id`,
  `title`,
  `seller_email`,
  `seller_id`,
  `min_order_qty`,
  `max_order_qty`,
  `sell_unit`,
  `price`,
  `stock`
FROM `products`
ORDER BY `id`
LIMIT 20;

-- Show table structure
DESCRIBE `products`;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
-- Now export your database:
-- mysqldump -u root -p gebya_net products > products_migrated.sql
-- 
-- Or use phpMyAdmin:
-- 1. Select 'products' table
-- 2. Click 'Export'
-- 3. Choose 'SQL' format
-- 4. Click 'Go'
-- ============================================================================
