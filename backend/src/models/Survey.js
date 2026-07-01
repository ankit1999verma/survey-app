const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const S = DataTypes.STRING;
const F = DataTypes.DOUBLE;

const Survey = sequelize.define('Survey', {
  id:   { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  uuid: { type: S, allowNull: false, unique: true },

  // GP identity (names stored for export even if FK becomes stale)
  stateId:          { type: DataTypes.INTEGER, allowNull: true },
  stateName:        { type: S, allowNull: true },
  districtId:       { type: DataTypes.INTEGER, allowNull: true },
  districtName:     { type: S, allowNull: true },
  blockId:          { type: DataTypes.INTEGER, allowNull: true },
  blockName:        { type: S, allowNull: true },
  gramPanchayatId:  { type: DataTypes.INTEGER, allowNull: true },
  gramPanchayatName:{ type: S, allowNull: true },
  gramPanchayatCode:{ type: S, allowNull: true },

  phase:        { type: S, allowNull: true },
  surveyVendor: { type: S, allowNull: true },
  surveyDate:   { type: S, allowNull: true },
  surveyDone:   { type: S, defaultValue: 'YES' },
  remarks:      { type: DataTypes.TEXT, allowNull: true },

  // Section A — Original Location
  origLocationType: { type: S, allowNull: true },
  origInfraStatus:  { type: S, allowNull: true },
  origElectricity:  { type: S, allowNull: true },
  origPowerHours:   { type: S, allowNull: true },
  origSolar:        { type: S, allowNull: true },
  origEarthing:     { type: S, allowNull: true },
  origLat:          { type: F, allowNull: true },
  origLong:         { type: F, allowNull: true },

  // Section B — Current Location
  currentLocation: { type: S, allowNull: true },
  currentPermTemp: { type: S, allowNull: true },
  currentLat:      { type: F, allowNull: true },
  currentLong:     { type: F, allowNull: true },

  // Section C — GP Bhawan
  gpBhawanAvailable:   { type: S, allowNull: true },
  gpBhawanInfraStatus: { type: S, allowNull: true },
  gpBhawanEnergyMeter: { type: S, allowNull: true },
  gpBhawanEarthing:    { type: S, allowNull: true },
  gpBhawanSolar:       { type: S, allowNull: true },
  gpBhawanLat:         { type: F, allowNull: true },
  gpBhawanLong:        { type: F, allowNull: true },

  // Section D — Proposed Location
  proposedBuilding:    { type: S, allowNull: true },
  proposedRackSpace:   { type: S, allowNull: true },
  proposedLat:         { type: F, allowNull: true },
  proposedLong:        { type: F, allowNull: true },
  proposedEnergyMeter: { type: S, allowNull: true },
  proposedEarthing:    { type: S, allowNull: true },
  proposedSolar:       { type: S, allowNull: true },
  proposedPoleLength:  { type: S, allowNull: true },
  proposedPoleLat:     { type: F, allowNull: true },
  proposedPoleLong:    { type: F, allowNull: true },
  proposedRemarks:     { type: DataTypes.TEXT, allowNull: true },

  // Sarpanch
  sarpanchName:    { type: S, allowNull: true },
  sarpanchContact: { type: S, allowNull: true },

  // Photo
  photoBase64:     { type: DataTypes.TEXT('long'), allowNull: true },

  userId:   { type: DataTypes.INTEGER, allowNull: true },
  syncedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  timestamps: true,
});

module.exports = Survey;
