const sequelize = require('./db/dbConnect.js');
const fs = require('fs');

async function runSetup() {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected\n');

    console.log('📥 Reading SQL file...');
    const sql = fs.readFileSync('./insert_subcats_only.sql', 'utf8');
    
    console.log('🚀 Executing SQL...');
    await sequelize.query(sql);
    
    console.log('✅ SQL executed successfully\n');

    // Verify
    const [subcatCount] = await sequelize.query('SELECT COUNT(*) as count FROM subcats');
    console.log(`📋 Subcategories: ${subcatCount[0].count}`);
    
    const [linkCount] = await sequelize.query('SELECT COUNT(*) as count FROM CatItem_Subcat');
    console.log(`🔗 Relationships: ${linkCount[0].count}\n`);

    // Show categories with counts
    const [categories] = await sequelize.query(`
      SELECT c.id, c.name, COUNT(cs.subcatId) as subcat_count
      FROM catitems c
      LEFT JOIN CatItem_Subcat cs ON c.id = cs.catItemId
      GROUP BY c.id, c.name
      ORDER BY c.id
    `);

    console.log('📊 Categories:');
    categories.forEach(cat => {
      console.log(`  ${cat.id}. ${cat.name}: ${cat.subcat_count} subcategories`);
    });

    console.log('\n✅ Setup complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runSetup();
