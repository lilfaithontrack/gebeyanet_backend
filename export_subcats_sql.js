// Export production-ready SQL for subcats and CatItem_Subcat from local DB
// Run: node export_subcats_sql.js
// Output: writes SQL to stdout (redirect to file if needed)

const { CatItem, Subcat } = require('./models/Associations.js');
const sequelize = require('./db/dbConnect.js');

function sqlEscape(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

(async () => {
  try {
    await sequelize.authenticate();
    console.log('-- Exported from local database on', new Date().toISOString());
    console.log('-- Run this in phpMyAdmin on the PRODUCTION database');
    console.log('');

    // 1. Export subcats
    const subcats = await Subcat.findAll({ order: [['id', 'ASC']] });
    console.log('-- =====================================================');
    console.log('-- subcats (%d rows)', subcats.length);
    console.log('-- =====================================================');
    console.log('DELETE FROM `subcats` WHERE `name` LIKE \'UpdatedSub%\';');
    console.log('INSERT IGNORE INTO `subcats` (`id`, `name`, `image`, `createdAt`, `updatedAt`) VALUES');
    const subRows = subcats.map(s => {
      const id = s.id;
      const name = sqlEscape(s.name);
      const image = sqlEscape(s.image);
      return `(${id}, ${name}, ${image}, NOW(), NOW())`;
    });
    console.log(subRows.join(',\n') + ';');
    console.log('');

    // 2. Export CatItem_Subcat links
    const [links] = await sequelize.query('SELECT catItemId, subcatId FROM CatItem_Subcat ORDER BY catItemId, subcatId');
    console.log('-- =====================================================');
    console.log('-- CatItem_Subcat (%d rows)', links.length);
    console.log('-- =====================================================');
    console.log('INSERT IGNORE INTO `CatItem_Subcat` (`catItemId`, `subcatId`, `createdAt`, `updatedAt`) VALUES');
    const linkRows = links.map(l => `(${l.catItemId}, ${l.subcatId}, NOW(), NOW())`);
    console.log(linkRows.join(',\n') + ';');
    console.log('');

    // 3. Summary
    console.log('-- =====================================================');
    console.log('-- Summary');
    console.log('-- =====================================================');
    console.log('-- subcats: %d rows', subcats.length);
    console.log('-- CatItem_Subcat: %d rows', links.length);
    console.log('');

    // 4. Show which cat_items IDs are referenced
    const catItemIds = [...new Set(links.map(l => l.catItemId))].sort((a, b) => a - b);
    console.log('-- cat_items IDs referenced in links:', catItemIds.join(', '));
    console.log('-- Make sure these IDs exist in production cat_items table!');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
