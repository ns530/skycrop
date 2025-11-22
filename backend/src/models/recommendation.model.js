'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database.config');

class Recommendation extends Model {}

Recommendation.init(
  {
    recommendation_id: {
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
    type: {
      type: DataTypes.ENUM(
        'fertilizer',
        'irrigation',
        'pest_control',
        'field_inspection',
        'monitoring',
        'water_management',
        'general'
      ),
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
      allowNull: false,
      defaultValue: 'medium',
    },
    urgency_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
      validate: {
        min: 0,
        max: 100,
      },
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    action_steps: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of action steps',
    },
    estimated_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Estimated cost in LKR',
    },
    expected_benefit: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    timing: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'e.g., "Within 3 days", "Immediate"',
    },
    valid_until: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'dismissed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    generated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    actioned_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'recommendations',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['field_id'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['priority'],
      },
      {
        fields: ['generated_at'],
      },
      {
        fields: ['valid_until'],
      },
    ],
  }
);

module.exports = Recommendation;
