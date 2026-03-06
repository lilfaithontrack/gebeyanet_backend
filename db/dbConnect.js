const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

// Create a new Sequelize instance with connection options
const sequelize = new Sequelize(
    process.env.DB_NAME || 'database',    // Database name
    process.env.DB_USER || 'username',    // Database username
    process.env.DB_PASSWORD || 'password', // Database password
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306, // Default MySQL port; convert to integer
        dialect: 'mysql', // Change this to 'postgres', 'mssql', etc., based on your database
        pool: {
            max: 10,
            min: 0,         // Minimum number of connections in the pool
            acquire: 30000, // Maximum time in ms to try to get a connection before throwing error
            idle: 10000     // Maximum time a connection can be idle before being released
        },
        logging: false,  // Set to console.log to see SQL queries
    }
);

// Function to check the connection status
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1); // Exit the process with failure
    }
};

// Function to initialize models and associations
const initializeModels = (models) => {
    Object.keys(models).forEach(modelName => {
        if (models[modelName].associate) {
            models[modelName].associate(models);
        }
    });
};

// Export the sequelize instance for use in models and the connect function
module.exports = sequelize;
module.exports.connectDB = connectDB;
module.exports.initializeModels = initializeModels;
