'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

/**
 * YieldPrediction Model
 * Mirrors PostgreSQL "yield_predictions" defined in backend/database/init.sql
 *
 * Columns:
 * - prediction_id UUID PK
 * - field_id UUID FK
 * - prediction_date DATE
 * - predicted_yield_per_ha DECIMAL(10,2)
 * - predicted_total_yield DECIMAL(10,2)
 * - confidence_lower DECIMAL(10,2)
 * - confidence_upper DECIMAL(10,2)
 * - expected_revenue DECIMAL(12,2)
 * - harvest_date_estimate DATE (nullable)
 * - model_version VARCHAR(20)
 * - features_used JSONB
 * - actual_yield DECIMAL(10,2) (nullable)
 * - accuracy_mape DECIMAL(5,2) (nullable)
 * - created_at TIMESTAMP DEFAULT NOW()
 *
 * Indexes:
 * - (field_id, prediction_date DESC)
 * - (harvest_date_estimate)
 */
const YieldPrediction = sequelize.define(
  'YieldPrediction',
  {
    prediction_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    field_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    prediction_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    predicted_yield_per_ha: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    predicted_total_yield: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    confidence_lower: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    confidence_upper: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    expected_revenue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    harvest_date_estimate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    model_version: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    features_used: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    actual_yield: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: { min: 0 },
    },
    accuracy_mape: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('NOW()'),
    },
  },
  {
    tableName: 'yield_predictions',
    timestamps: false, // only created_at is present
    underscored: true,
    freezeTableName: true,
    indexes: [
      { fields: ['field_id', { name: 'prediction_date', order: 'DESC' }] },
      { fields: ['harvest_date_estimate'] },
    ],
  }
);

// Optional association placeholder
// YieldPrediction.associate = (models) => {
//   YieldPrediction.belongsTo(models.Field, { foreignKey: 'field_id', as: 'field' });
// };

module.exports = YieldPrediction;