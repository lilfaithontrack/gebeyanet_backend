// NOTE: table name is 'checkouts' (lowercase) to match the Checkout model tableName.
// user_id is INTEGER to match the User model primary key (not UUID).
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('checkouts', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null for guests
      defaultValue: null, // Default to null if not specified
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('checkouts', 'user_id');
  },
};

