/**
 * Export Products to SQL File
 * Creates a complete SQL dump of the products table
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
require('dotenv').config();

async function exportProducts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gebyanet'
  });

  try {
    console.log('📤 Exporting products to SQL file...\n');

    // Get table structure
    const [createTable] = await connection.query('SHOW CREATE TABLE products');
    const createTableSQL = createTable[0]['Create Table'];

    // Get all products
    const [products] = await connection.query('SELECT * FROM products ORDER BY id');
    console.log(`✅ Found ${products.length} products to export\n`);

    // Build SQL file content
    let sqlContent = `-- GebyaNet Products Export
-- Generated: ${new Date().toISOString()}
-- Total Products: ${products.length}
-- Database: gebyanet

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Table structure for table \`products\`
-- --------------------------------------------------------

DROP TABLE IF EXISTS \`products\`;

${createTableSQL};

-- --------------------------------------------------------
-- Dumping data for table \`products\`
-- --------------------------------------------------------

`;

    // Add INSERT statements in batches of 50
    const batchSize = 50;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      sqlContent += `INSERT INTO \`products\` (`;
      
      // Column names
      const columns = Object.keys(batch[0]);
      sqlContent += columns.map(col => `\`${col}\``).join(', ');
      sqlContent += `) VALUES\n`;
      
      // Values
      const values = batch.map(product => {
        const vals = columns.map(col => {
          const val = product[col];
          if (val === null) return 'NULL';
          if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
          if (typeof val === 'string') return `'${val.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
          if (Buffer.isBuffer(val)) return `ST_GeomFromText('POINT(${val.toString()})')`;
          return val;
        });
        return `(${vals.join(', ')})`;
      }).join(',\n');
      
      sqlContent += values + ';\n\n';
      
      if ((i + batchSize) % 100 === 0) {
        console.log(`  ✓ Processed ${Math.min(i + batchSize, products.length)}/${products.length} products...`);
      }
    }

    sqlContent += `
SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- Export completed successfully
`;

    // Write to file
    const outputFile = 'products_migrated.sql';
    await fs.writeFile(outputFile, sqlContent, 'utf8');
    
    const stats = await fs.stat(outputFile);
    console.log(`\n✅ Export completed successfully!`);
    console.log(`   File: ${outputFile}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Products: ${products.length}\n`);

    console.log('📤 Next steps:');
    console.log('   1. Upload products_migrated.sql to cPanel');
    console.log('   2. Import via phpMyAdmin on cPanel');
    console.log('   3. Restart your Node.js app\n');

  } catch (error) {
    console.error('\n❌ Export failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

exportProducts();
