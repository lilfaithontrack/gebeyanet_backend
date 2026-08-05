const sequelize = require('./db/dbConnect.js');
const fs = require('fs');

async function setupCategories() {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected\n');

    // Read and execute subcats SQL
    console.log('📥 Importing subcategories...');
    const subcatsSql = fs.readFileSync('C:\\Users\\kalu4\\Downloads\\subcats.sql', 'utf8');
    
    // Clear existing subcats first
    await sequelize.query('DELETE FROM subcats');
    console.log('🗑️  Cleared existing subcats');
    
    // Import subcats
    await sequelize.query(subcatsSql);
    const [subcatCount] = await sequelize.query('SELECT COUNT(*) as count FROM subcats');
    console.log(`✅ Imported ${subcatCount[0].count} subcategories\n`);

    // Read and execute category-subcat relationships
    console.log('🔗 Creating category-subcategory relationships...');
    const linkSql = fs.readFileSync('./link_categories_subcats.sql', 'utf8');
    await sequelize.query(linkSql);
    
    const [linkCount] = await sequelize.query('SELECT COUNT(*) as count FROM CatItem_Subcat');
    console.log(`✅ Created ${linkCount[0].count} relationships\n`);

    // Verify the setup
    console.log('🔍 Verifying setup...');
    const [categories] = await sequelize.query(`
      SELECT c.id, c.name, COUNT(cs.subcatId) as subcat_count
      FROM catitems c
      LEFT JOIN CatItem_Subcat cs ON c.id = cs.catItemId
      GROUP BY c.id, c.name
      ORDER BY c.id
    `);

    console.log('\n📊 Categories with subcategory counts:');
    categories.forEach(cat => {
      console.log(`  ${cat.id}. ${cat.name}: ${cat.subcat_count} subcategories`);
    });

    console.log('\n✅ Setup complete! Categories are ready to use.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupCategories();
