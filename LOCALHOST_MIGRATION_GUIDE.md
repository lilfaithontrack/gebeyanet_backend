# 🔧 Localhost Migration Guide

## Step-by-Step: Apply Product Migration on Localhost

### Prerequisites
- ✅ XAMPP/WAMP running with MySQL
- ✅ phpMyAdmin accessible at `http://localhost/phpmyadmin`
- ✅ Database `gebya_net` exists with `products` table

---

## 📋 Method 1: Using phpMyAdmin (Easiest)

### Step 1: Open phpMyAdmin
1. Start XAMPP/WAMP
2. Open browser: `http://localhost/phpmyadmin`
3. Select database: `gebya_net`

### Step 2: Import Original Products
1. Click **Import** tab
2. Choose file: `products.sql`
3. Click **Go**
4. Wait for import to complete

### Step 3: Run Migration Script
1. Click **SQL** tab
2. Open file: `apply_migration_localhost.sql`
3. Copy all content
4. Paste into SQL query box
5. Click **Go**
6. Check for success message

### Step 4: Verify Migration
Run this query to check results:
```sql
SELECT 
  id, title, min_order_qty, max_order_qty, sell_unit, 
  seller_id, price, stock
FROM products
LIMIT 10;
```

You should see:
- ✅ `min_order_qty` column with values
- ✅ `max_order_qty` column with values
- ✅ `sell_unit` column (kg, piece, etc.)
- ✅ `seller_id` column
- ❌ NO `productfor` column

### Step 5: Export Migrated Database
1. Select `products` table (checkbox)
2. Click **Export** tab
3. Choose:
   - Format: **SQL**
   - Export method: **Quick**
   - ✅ Check "Add DROP TABLE"
   - ✅ Check "Add CREATE TABLE"
4. Click **Go**
5. Save as: `products_migrated.sql`

---

## 📋 Method 2: Using MySQL Command Line

### Step 1: Open Command Prompt
```bash
cd "c:\Users\kalu4\Pictures\Gebya net\gebyabet_backend"
```

### Step 2: Import Original Products (if needed)
```bash
mysql -u root -p gebya_net < products.sql
```

### Step 3: Run Migration
```bash
mysql -u root -p gebya_net < apply_migration_localhost.sql
```

### Step 4: Verify
```bash
mysql -u root -p gebya_net -e "SELECT id, title, min_order_qty, max_order_qty, sell_unit FROM products LIMIT 10;"
```

### Step 5: Export Migrated Data
```bash
mysqldump -u root -p gebya_net products > products_migrated.sql
```

---

## 📤 Upload to cPanel

### Option A: Using phpMyAdmin on cPanel
1. Login to cPanel
2. Open **phpMyAdmin**
3. Select database: `gebya_net` (or your production DB name)
4. Click **Import**
5. Upload: `products_migrated.sql`
6. Click **Go**

### Option B: Using cPanel File Manager + Terminal
1. Upload `products_migrated.sql` via File Manager
2. Open **Terminal** in cPanel
3. Run:
```bash
mysql -u your_db_user -p your_db_name < products_migrated.sql
```

---

## ✅ Verification Checklist

After migration, verify:

- [ ] `productfor` column is removed
- [ ] `seller_id` column exists with value 1
- [ ] `min_order_qty` has values (0.1 to 2)
- [ ] `max_order_qty` has values (2 to 100)
- [ ] `sell_unit` shows correct units (kg, piece, etc.)
- [ ] All products still have images
- [ ] Prices are intact
- [ ] Stock status unchanged
- [ ] Location data preserved

---

## 🔍 Sample Verification Queries

### Check Column Structure
```sql
DESCRIBE products;
```

### Check Quantity Limits
```sql
SELECT 
  title,
  min_order_qty,
  max_order_qty,
  sell_unit,
  price
FROM products
WHERE catItems = '7'
ORDER BY subcat, id
LIMIT 20;
```

### Check for productfor Column (should return error)
```sql
SELECT productfor FROM products LIMIT 1;
-- Expected: Error - Unknown column 'productfor'
```

### Count Products by Unit Type
```sql
SELECT 
  sell_unit,
  COUNT(*) as count,
  AVG(min_order_qty) as avg_min,
  AVG(max_order_qty) as avg_max
FROM products
GROUP BY sell_unit;
```

---

## 🚨 Troubleshooting

### Issue: "Column already exists"
**Solution**: Column was already added, skip to next step

### Issue: "Unknown column 'productfor'"
**Solution**: Column already removed, migration successful!

### Issue: "Table doesn't exist"
**Solution**: Import `products.sql` first

### Issue: Random values are 0
**Solution**: MySQL RAND() might need adjustment, run:
```sql
UPDATE products 
SET min_order_qty = 1, max_order_qty = 50 
WHERE min_order_qty = 0 OR max_order_qty = 0;
```

---

## 📊 Expected Results

### Before Migration
```
| id | title      | productfor | seller_id | min_order_qty | max_order_qty |
|----|------------|------------|-----------|---------------|---------------|
| 23 | ብርቱካን      | for_user   | NULL      | NULL          | NULL          |
```

### After Migration
```
| id | title      | seller_id | min_order_qty | max_order_qty | sell_unit |
|----|------------|-----------|---------------|---------------|-----------|
| 23 | ብርቱካን      | 1         | 1.5           | 25            | kg        |
```

---

## 🎯 Quick Commands Summary

```bash
# Navigate to project
cd "c:\Users\kalu4\Pictures\Gebya net\gebyabet_backend"

# Run migration
mysql -u root -p gebya_net < apply_migration_localhost.sql

# Export migrated data
mysqldump -u root -p gebya_net products > products_migrated.sql

# Verify export file size (should be ~500KB)
dir products_migrated.sql
```

---

## ✨ Success Indicators

You'll know the migration worked when:

1. ✅ No errors in phpMyAdmin/terminal
2. ✅ `products_migrated.sql` file created (~500KB)
3. ✅ Verification queries return expected data
4. ✅ Backend can read products without errors
5. ✅ Products show quantity limits in API responses

---

**Ready to upload to cPanel!** 🚀
