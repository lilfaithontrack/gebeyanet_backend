# 📥 Import 742 Products - Simple Method

## ✅ Easiest Way: Use phpMyAdmin

### Step 1: Open phpMyAdmin
1. Start XAMPP/WAMP
2. Go to: `http://localhost/phpmyadmin`
3. Select database: `gebyanet`

### Step 2: Disable Foreign Key Checks
1. Click **SQL** tab
2. Run this command:
```sql
SET FOREIGN_KEY_CHECKS = 0;
```
3. Click **Go**

### Step 3: Import products.sql
1. Click **Import** tab
2. Click **Choose File**
3. Select: `products.sql` (from your project folder)
4. Format: **SQL**
5. Click **Go**
6. Wait for import (may take 1-2 minutes)

### Step 4: Re-enable Foreign Key Checks
1. Click **SQL** tab
2. Run this command:
```sql
SET FOREIGN_KEY_CHECKS = 1;
```
3. Click **Go**

### Step 5: Apply Migration (Add Quantity Limits)
1. Still in **SQL** tab
2. Copy and paste this entire script:

```sql
-- Add missing columns if they don't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id INT NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_order_qty FLOAT NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_order_qty FLOAT DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sell_unit ENUM('piece','dozen','kg','quintal','box','liter','meter','pack','pair') NOT NULL DEFAULT 'kg';

-- Apply quantity limits
UPDATE products 
SET 
  min_order_qty = CASE 
    WHEN catItems = '7' AND subcat IN ('5', '6', '7') THEN 0.5 + (RAND() * 2)
    WHEN catItems = '7' AND subcat IN ('11', '15') THEN 0.1 + (RAND() * 0.4)
    WHEN catItems = '7' AND subcat = '8' THEN 1
    ELSE 1
  END,
  max_order_qty = CASE 
    WHEN catItems = '7' AND subcat IN ('5', '6', '7') THEN 10 + (RAND() * 40)
    WHEN catItems = '7' AND subcat IN ('11', '15') THEN 2 + (RAND() * 8)
    WHEN catItems = '7' AND subcat = '8' THEN 30 + (RAND() * 70)
    ELSE 50
  END,
  sell_unit = CASE
    WHEN unit_of_measurement LIKE '%ኪሎ%' OR size LIKE '%ኪሎ%' THEN 'kg'
    WHEN unit_of_measurement LIKE '%ፍሬ%' OR size LIKE '%ፍሬ%' THEN 'piece'
    WHEN title LIKE '%እንቁላል%' THEN 'piece'
    ELSE 'kg'
  END,
  seller_id = 1
WHERE id > 0;

-- Remove productfor column
ALTER TABLE products DROP COLUMN IF EXISTS productfor;

-- Verify
SELECT COUNT(*) as total_products FROM products;
```

3. Click **Go**

### Step 6: Verify Import
Run this query:
```sql
SELECT id, title, min_order_qty, max_order_qty, sell_unit, price, stock
FROM products
ORDER BY id DESC
LIMIT 10;
```

You should see:
- ✅ ~742 products total
- ✅ min_order_qty with values
- ✅ max_order_qty with values
- ✅ sell_unit (kg, piece, etc.)
- ❌ NO productfor column

---

## 📤 Export After Import

### Method 1: phpMyAdmin Export
1. Select `products` table
2. Click **Export**
3. Format: **SQL**
4. Options:
   - ✅ Add DROP TABLE
   - ✅ Add CREATE TABLE
   - ✅ Complete inserts
5. Click **Go**
6. Save as: `products_migrated.sql`

### Method 2: Command Line Export
```bash
mysqldump -u root -p gebyanet products > products_migrated.sql
```

---

## 🚀 Upload to cPanel

1. Login to cPanel
2. Open **phpMyAdmin**
3. Select production database
4. Click **Import**
5. Upload `products_migrated.sql`
6. Click **Go**

---

## ✅ Success Checklist

After import, verify:
- [ ] Total products = ~742
- [ ] All products have min_order_qty
- [ ] All products have max_order_qty
- [ ] All products have sell_unit
- [ ] productfor column removed
- [ ] seller_id = 1 for all products
- [ ] Backend can read products without errors

---

## 🔧 Troubleshooting

### "Foreign key constraint fails"
**Solution**: Make sure you disabled foreign key checks first:
```sql
SET FOREIGN_KEY_CHECKS = 0;
```

### "Duplicate entry for key PRIMARY"
**Solution**: Clear the table first:
```sql
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM products;
SET FOREIGN_KEY_CHECKS = 1;
```
Then import again.

### "Unknown column 'productfor'"
**Solution**: This is expected after migration. The column was removed.

---

**That's it!** Your 742 products are now imported with quantity limits! 🎉
