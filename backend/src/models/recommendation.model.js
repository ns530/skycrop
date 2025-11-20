'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

/**
 * Recommendation Model (Sprint 3 alerts)
 * Mirrors PostgreSQL "recommendations" table defined in backend/database/init.sql
 * Columns:
 * - id UUID PK
 * - field_id UUID FK → fields(field_id)
 * - timestamp TIMESTAMPTZ NOT NULL
 * - type TEXT CHECK IN ('water','fertilizer')
 * - severity TEXT CHECK IN ('low','medium','high')
 * - reason TEXT NOT NULL
 * - details JSONB
 * - created_at TIMESTAMPTZ DEFAULT now()
 * - updated_at TIMESTAMPTZ
 */
const Recommendation = sequelize.define(
  'Recommendation',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    field_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE, // TIMESTAMPTZ
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [['water', 'fertilizer']] },
    },
    severity: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [['low', 'medium', 'high']] },
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('NOW()'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'recommendations',
    timestamps: false,
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: 'uq_recommendations_field_ts_type',
        unique: true,
        fields: ['field_id', 'timestamp', 'type'],
      },
      {
        name: 'idx_recommendations_field_ts_desc_app',
        fields: ['field_id', 'timestamp'],
      },
    ],
  }
);

module.exports = Recommendation;