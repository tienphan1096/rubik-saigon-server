'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Puzzle extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Puzzle.belongsTo(models.PuzzleType, { foreignKey: 'type' })
    }
  };
  Puzzle.init({
    name: DataTypes.STRING,
    price: DataTypes.DECIMAL,
    image: DataTypes.STRING,
    type: DataTypes.INTEGER,
    url: {
      type: DataTypes.STRING,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'Puzzle',
  });
  return Puzzle;
};