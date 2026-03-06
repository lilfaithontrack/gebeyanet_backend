const sequelize = require('./db/dbConnect.js');
const Product = require('./models/AddProduct.js'); // references 'products' table
const UOM = require('./models/UOM.js');

async function fix() {
    try {
        // Manually associate for the sync
        Product.hasMany(UOM, { foreignKey: 'product_id', as: 'uoms' });
        UOM.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

        console.log("Syncing database with alter: true...");
        await sequelize.sync({ alter: true });
        console.log("Database synced successfully!");
    } catch (err) {
        console.error("Sync failed:", err.message);
    } finally {
        await sequelize.close();
    }
}

fix();
