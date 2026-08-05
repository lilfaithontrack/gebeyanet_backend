/**
 * Migration Script: Approve ALL Seller Products
 *
 * Bulk-sets every row in the `products` table (the seller product table,
 * model: models/AddProduct.js -> Product) to status = 'approved' in one shot,
 * so the admin doesn't have to click "Approve" one-by-one in the panel.
 *
 * Default: approves only `pending` products (safe).
 * Pass `--all` to also flip `rejected` products back to `approved`.
 *
 * Run with:  node approve_all_seller_products.js          (pending only)
 *        or: node approve_all_seller_products.js --all    (pending + rejected)
 */

const sequelize = require('./db/dbConnect.js');

const approveAll = async () => {
  const includeRejected = process.argv.includes('--all');

  try {
    console.log('Approving seller products (table: products) in bulk...\n');

    await sequelize.authenticate();
    console.log('Database connected.\n');

    const whereClause = includeRejected
      ? "status IN ('pending','rejected')"
      : "status = 'pending'";

    // Pre-counts
    const [pendingRows] = await sequelize.query(
      "SELECT COUNT(*) AS cnt FROM products WHERE status = 'pending'"
    );
    const [rejectedRows] = await sequelize.query(
      "SELECT COUNT(*) AS cnt FROM products WHERE status = 'rejected'"
    );
    const [approvedRows] = await sequelize.query(
      "SELECT COUNT(*) AS cnt FROM products WHERE status = 'approved'"
    );

    const pending = Number(pendingRows[0].cnt);
    const rejected = Number(rejectedRows[0].cnt);
    const alreadyApproved = Number(approvedRows[0].cnt);

    console.log('Before:');
    console.log(`  pending:   ${pending}`);
    console.log(`  rejected:  ${rejected}`);
    console.log(`  approved:  ${alreadyApproved}`);
    console.log(`  target:    ${includeRejected ? 'pending + rejected' : 'pending only'}\n`);

    // Bulk update via raw SQL (fastest, single statement)
    const [result] = await sequelize.query(
      `UPDATE products SET status = 'approved', updated_at = NOW() WHERE ${whereClause}`
    );
    const updated = result.affectedRows !== undefined ? result.affectedRows : result.changedRows;
    console.log(`Updated ${updated} product(s) to 'approved'.\n`);

    // Post-counts
    const [approvedRowsAfter] = await sequelize.query(
      "SELECT COUNT(*) AS cnt FROM products WHERE status = 'approved'"
    );
    const [pendingRowsAfter] = await sequelize.query(
      "SELECT COUNT(*) AS cnt FROM products WHERE status = 'pending'"
    );
    const [rejectedRowsAfter] = await sequelize.query(
      "SELECT COUNT(*) AS cnt FROM products WHERE status = 'rejected'"
    );

    console.log('After:');
    console.log(`  pending:   ${Number(pendingRowsAfter[0].cnt)}`);
    console.log(`  rejected:  ${Number(rejectedRowsAfter[0].cnt)}`);
    console.log(`  approved:  ${Number(approvedRowsAfter[0].cnt)}`);

    console.log('\nMigration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

approveAll();
