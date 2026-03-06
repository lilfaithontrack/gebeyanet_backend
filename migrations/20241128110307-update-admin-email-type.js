// migrations/[timestamp]-update-admin-email-type.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Admins', 'email', {
      type: Sequelize.STRING, // Change from TEXT to STRING
      allowNull: false,
      unique: true, // Ensure email is unique
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Admins', 'email', {
      type: Sequelize.TEXT, // Revert back to TEXT in case of rollback
      allowNull: false,
      unique: true,
    });
  },
};

