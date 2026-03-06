const sequelize = require('./db/dbConnect.js');

async function repair() {
    try {
        console.log("Adding Primary Key to 'products' table...");
        await sequelize.query("ALTER TABLE products MODIFY id INT(11) AUTO_INCREMENT PRIMARY KEY;");
        console.log("Primary Key added successfully to 'products'!");

        console.log("Adding Primary Key to 'addproduct' table...");
        await sequelize.query("ALTER TABLE addproduct MODIFY id INT(11) AUTO_INCREMENT PRIMARY KEY;");
        console.log("Primary Key added successfully to 'addproduct'!");
    } catch (err) {
        console.error("Repair failed:", err.message);
    } finally {
        await sequelize.close();
    }
}

repair();
