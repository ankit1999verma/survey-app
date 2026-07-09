const sequelize = require('../config/database');
const State = require('./State');
const District = require('./District');
const Block = require('./Block');
const GramPanchayat = require('./GramPanchayat');
const User = require('./User');
const Survey = require('./Survey');

// Define Relationships

// State -> District (1:N)
State.hasMany(District, { foreignKey: 'stateId' });
District.belongsTo(State, { foreignKey: 'stateId' });

// District -> Block (1:N)
District.hasMany(Block, { foreignKey: 'districtId' });
Block.belongsTo(District, { foreignKey: 'districtId' });

// Block -> GramPanchayat (1:N)
Block.hasMany(GramPanchayat, { foreignKey: 'blockId' });
GramPanchayat.belongsTo(Block, { foreignKey: 'blockId' });

// User -> Survey (1:N)
User.hasMany(Survey, { foreignKey: 'userId' });
Survey.belongsTo(User, { foreignKey: 'userId' });

// Survey Location Relationships
State.hasMany(Survey, { foreignKey: 'stateId' });
Survey.belongsTo(State, { foreignKey: 'stateId' });

District.hasMany(Survey, { foreignKey: 'districtId' });
Survey.belongsTo(District, { foreignKey: 'districtId' });

Block.hasMany(Survey, { foreignKey: 'blockId' });
Survey.belongsTo(Block, { foreignKey: 'blockId' });

GramPanchayat.hasMany(Survey, { foreignKey: 'gramPanchayatId' });
Survey.belongsTo(GramPanchayat, { foreignKey: 'gramPanchayatId' });

module.exports = {
  sequelize,
  State,
  District,
  Block,
  GramPanchayat,
  User,
  Survey
};
