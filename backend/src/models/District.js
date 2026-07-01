const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const State = require('./State');

const District = sequelize.define('District', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  stateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: State,
      key: 'id',
    },
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['stateId'] }
  ]
});

State.hasMany(District, { foreignKey: 'stateId', onDelete: 'CASCADE' });
District.belongsTo(State, { foreignKey: 'stateId' });

module.exports = District;
