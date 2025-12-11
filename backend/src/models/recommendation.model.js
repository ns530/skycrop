'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database.config');

class Recommendation extends Model {}

Recommendation.init(
  {
    recommendationid: {
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
        'pestcontrol',
        'fieldinspection',
        'monitoring',
        'watermanagement',
        'general'
      ),
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
      allowNull: false,
      defaultValue: 'medium',
    },
    urgencyscore: {
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
    actionsteps: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of action steps',
    },
    estimatedcost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Estimated cost in LKR',
    },
    expectedbenefit: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    timing: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'e.g., "Within 3 days", "Immediate"',
    },
    validuntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'inprogress', 'completed', 'dismissed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    generatedat: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    actionedat: {
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
        fields: ['generatedat'],
      },
      {
        fields: ['validuntil'],
      },
    ],
  }
);

module.exports = Recommendation;
