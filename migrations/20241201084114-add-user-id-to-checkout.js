module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Checkouts', 'user_id', {
      type: Sequelize.UUID,
      allowNull: true, // Allow null for guests
      defaultValue: null, // Default to null if not specified
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Checkouts', 'user_id');
  },
};

