'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PuzzleTypes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PuzzleTypes');
  }
};