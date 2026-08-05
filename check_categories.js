const { CatItem, Subcat } = require('./models/Associations.js');
const sequelize = require('./db/dbConnect.js');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Check CatItems
    const catItems = await CatItem.findAll({
      include: {
        model: Subcat,
        as: 'subcats',
        attributes: ['id', 'name', 'image'],
        through: { attributes: [] }
      }
    });

    console.log(`📦 CatItems found: ${catItems.length}\n`);
    
    if (catItems.length === 0) {
      console.log('⚠️  No main categories (catitems) found in database!');
    } else {
      catItems.forEach(cat => {
        console.log(`- ${cat.name}`);
        console.log(`  Image: ${cat.image || 'No image'}`);
        console.log(`  Subcategories: ${cat.subcats?.length || 0}`);
        if (cat.subcats && cat.subcats.length > 0) {
          cat.subcats.forEach(sub => {
            console.log(`    - ${sub.name} (${sub.image || 'no image'})`);
          });
        }
        console.log('');
      });
    }

    // Check Subcats
    const subcats = await Subcat.findAll();
    console.log(`\n📋 Subcats found: ${subcats.length}`);
    
    // Check join table
    const [results] = await sequelize.query('SELECT * FROM CatItem_Subcat LIMIT 5');
    console.log(`\n🔗 CatItem_Subcat relationships: ${results.length > 0 ? results.length + ' found' : 'None found'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
