const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const District = require('./District');

const Block = sequelize.define('Block', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  districtId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: District,
      key: 'id',
    },
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['districtId'] }
  ]
});

District.hasMany(Block, { foreignKey: 'districtId', onDelete: 'CASCADE' });
Block.belongsTo(District, { foreignKey: 'districtId' });

module.exports = Block;
