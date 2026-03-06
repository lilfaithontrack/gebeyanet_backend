const sequelize = require('./db/dbConnect.js');
const { QueryTypes } = require('sequelize');

async function repairAll() {
    try {
        const tablesRaw = await sequelize.query("SHOW TABLES", { type: QueryTypes.SELECT });
        const tables = tablesRaw.map(t => Object.values(t)[0]);
        console.log("Checking tables:", tables);

        for (const table of tables) {
            const columns = await sequelize.query(`DESCRIBE \`${table}\``, { type: QueryTypes.SELECT });
            const hasPk = columns.some(c => c.Key === 'PRI');

            if (!hasPk) {
                console.log(`Table '${table}' is missing a Primary Key. Attempting to fix 'id' column...`);
                try {
                    // Check if 'id' column exists
                    const hasId = columns.some(c => c.Field === 'id');
                    if (hasId) {
                        await sequelize.query(`ALTER TABLE \`${table}\` MODIFY id INT(11) AUTO_INCREMENT PRIMARY KEY;`);
                        console.log(`Successfully added PK to '${table}'.`);
                    } else {
                        console.warn(`Table '${table}' has no 'id' column. Skipping auto-fix.`);
                    }
                } catch (err) {
                    console.error(`Failed to fix '${table}':`, err.message);
                }
            }
        }
    } catch (err) {
        console.error("Repair failed:", err.message);
    } finally {
        await sequelize.close();
    }
}

repairAll();
