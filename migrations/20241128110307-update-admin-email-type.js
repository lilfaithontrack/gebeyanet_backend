// migrations/[timestamp]-update-admin-email-type.js
// NOTE: table name is 'admin' (singular, lowercase) to match the Admin model tableName.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('admin', 'email', {
      type: Sequelize.STRING, // Change from TEXT to STRING
      allowNull: false,
      unique: true, // Ensure email is unique
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('admin', 'email', {
      type: Sequelize.TEXT, // Revert back to TEXT in case of rollback
      allowNull: false,
      unique: true,
    });
  },
};

