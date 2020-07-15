'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('PuzzleTypes', [
      { name: '2x2' },
      { name: '3x3' },
      { name: '4x4' },
      { name: '5x5' },
      { name: '6x6' },
      { name: '7x7' },
      { name: 'Biến thể 4 mặt' },
      { name: 'Biến thể 6 mặt' },
      { name: 'Biến thể 8 mặt' },
      { name: 'Biến thể 10 mặt' },
      { name: 'Biến thể 12 mặt' },
      { name: 'Big cube' },
      { name: 'Truyền thống big cube' },
      { name: 'Khác' },

    ]);
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('PuzzleTypes', null, {});
  }
};
