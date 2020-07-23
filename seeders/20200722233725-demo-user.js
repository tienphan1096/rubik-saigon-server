'use strict';

const { query } = require("express");
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hash = await bcrypt.hash('password', parseInt(process.env.SALT_ROUNDS))
    return queryInterface.bulkInsert('Users', [
      {
        username: 'test',
        password: hash,
      }
    ])
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {})
  }
};
