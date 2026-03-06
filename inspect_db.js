const sequelize = require('./db/dbConnect.js');
const { QueryTypes } = require('sequelize');

async function inspect() {
    try {
        const tables = await sequelize.query("SHOW TABLES", { type: QueryTypes.SELECT });
        console.log("Tables:", JSON.stringify(tables, null, 2));

        const productSchema = await sequelize.query("DESCRIBE products", { type: QueryTypes.SELECT });
        console.log("Schema of 'products':", JSON.stringify(productSchema, null, 2));

        const addProductSchema = await sequelize.query("DESCRIBE addproduct", { type: QueryTypes.SELECT });
        console.log("Schema of 'addproduct':", JSON.stringify(addProductSchema, null, 2));

    } catch (err) {
        console.error("Inspection failed:", err.message);
    } finally {
        await sequelize.close();
    }
}

inspect();
