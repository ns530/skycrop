'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

/**
 * ActualYield Model
 * Mirrors PostgreSQL "actual_yields" table for farmer-entered harvest data
 * 
 * Columns:
 * - yield_id UUID PK
 * - field_id UUID FK
 * - user_id UUID FK
 * - actual_yield_per_ha DECIMAL(10,2) NOT NULL
 * - total_yield_kg DECIMAL(10,2) NOT NULL
 * - harvest_date DATE NOT NULL
 * - prediction_id UUID FK (nullable, links to yield_predictions)
 * - predicted_yield_per_ha DECIMAL(10,2) (nullable)
 * - accuracy_mape DECIMAL(5,2) (nullable, auto-calculated by trigger)
 * - notes TEXT (nullable)
 * - crop_variety VARCHAR(100) (nullable)
 * - season VARCHAR(20) (nullable: maha, yala, other)
 * - created_at TIMESTAMP DEFAULT NOW()
 * - updated_at TIMESTAMP DEFAULT NOW()
 * 
 * Indexes:
 * - (field_id, harvest_date DESC)
 * - (user_id, harvest_date DESC)
 * - (season, harvest_date DESC)
 * - UNIQUE (field_id, harvest_date)
 * 
 * Triggers:
 * - Auto-calculate accuracy_mape if prediction exists
 * - Auto-update updated_at on modification
 */
const ActualYield = sequelize.define(
  'ActualYield',
  {
    yield_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    field_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'fields',
        key: 'field_id',
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
    },
    actual_yield_per_ha: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    total_yield_kg: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    harvest_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isNotFuture(value) {
          if (new Date(value) > new Date()) {
            throw new Error('Harvest date cannot be in the future');
          }
        },
      },
    },
    prediction_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'yield_predictions',
        key: 'prediction_id',
      },
    },
    predicted_yield_per_ha: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    accuracy_mape: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
        isDecimal: true,
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    crop_variety: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    season: {
      type: DataTypes.ENUM('maha', 'yala', 'other'),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('NOW()'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('NOW()'),
    },
  },
  {
    tableName: 'actual_yields',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      // Field + harvest date for history queries
      { fields: ['field_id', { name: 'harvest_date', order: 'DESC' }] },
      // User + harvest date for user's all yields
      { fields: ['user_id', { name: 'harvest_date', order: 'DESC' }] },
      // Season-based queries
      { fields: ['season', { name: 'harvest_date', order: 'DESC' }] },
      // Unique constraint: one entry per field per harvest date
      { unique: true, fields: ['field_id', 'harvest_date'], name: 'idx_actual_yields_field_harvest_unique' },
      // Prediction lookup
      { fields: ['prediction_id'], where: { prediction_id: { [sequelize.Op.ne]: null } } },
    ],
  }
);

/**
 * Associations (to be called in model index/initialization)
 */
ActualYield.associate = (models) => {
  // Belongs to Field
  ActualYield.belongsTo(models.Field, {
    foreignKey: 'field_id',
    as: 'field',
  });

  // Belongs to User
  ActualYield.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'farmer',
  });

  // Optional: Belongs to YieldPrediction (for accuracy tracking)
  if (models.YieldPrediction) {
    ActualYield.belongsTo(models.YieldPrediction, {
      foreignKey: 'prediction_id',
      as: 'prediction',
    });
  }
};

module.exports = ActualYield;

