'use strict';

/**
 * Models Index
 * Central export for all Sequelize models
 */

const { sequelize } = require('../config/database.config');

// Import all models
const User = require('./user.model');
const Field = require('./field.model');
const Health = require('./health.model');
const Recommendation = require('./recommendation.model');
const YieldPrediction = require('./yield_prediction.model');
const ActualYield = require('./actualYield.model');
const FieldShare = require('./fieldShare.model');
const DeviceToken = require('./deviceToken.model');

// Define associations here (if any)
// Example:
// User.hasMany(Field, { foreignKey: 'user_id', as: 'fields' });
// Field.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });

// Field.hasMany(Health, { foreignKey: 'field_id', as: 'healthRecords' });
// Health.belongsTo(Field, { foreignKey: 'field_id', as: 'field' });

// Field.hasMany(Recommendation, { foreignKey: 'field_id', as: 'recommendations' });
// Recommendation.belongsTo(Field, { foreignKey: 'field_id', as: 'field' });

// Field.hasMany(YieldPrediction, { foreignKey: 'field_id', as: 'yieldPredictions' });
// YieldPrediction.belongsTo(Field, { foreignKey: 'field_id', as: 'field' });

// Field.hasMany(ActualYield, { foreignKey: 'field_id', as: 'actualYields' });
// ActualYield.belongsTo(Field, { foreignKey: 'field_id', as: 'field' });

// Export all models and sequelize instance
module.exports = {
  sequelize,
  User,
  Field,
  Health,
  Recommendation,
  YieldPrediction,
  ActualYield,
  FieldShare,
  DeviceToken,
};

