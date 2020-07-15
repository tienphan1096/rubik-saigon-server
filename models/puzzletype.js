'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PuzzleType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  PuzzleType.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'PuzzleType',
    timestamps: false,
  });
  return PuzzleType;
};