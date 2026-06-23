const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Block = require('./Block');

const GramPanchayat = sequelize.define('GramPanchayat', {
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
  blockId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Block,
      key: 'id',
    },
  },
}, {
  timestamps: true,
});

Block.hasMany(GramPanchayat, { foreignKey: 'blockId', onDelete: 'CASCADE' });
GramPanchayat.belongsTo(Block, { foreignKey: 'blockId' });

module.exports = GramPanchayat;
