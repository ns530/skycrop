'use strict';

const { DataTypes, literal } = require('sequelize');
const { sequelize } = require('../config/database.config');

/**
 * HealthRecord Model
 * Mirrors PostgreSQL "health_records" table defined in database/init.sql
 *
 * Columns:
 * - record_id UUID PK
 * - field_id UUID FK (fields.field_id)
 * - measurement_date DATE
 * - ndvi_* / ndwi_* / tdvi_mean DECIMAL(5,4)
 * - health_status ENUM('excellent','good','fair','poor')
 * - health_score INTEGER (0-100)
 * - trend ENUM('improving','stable','declining')
 * - satellite_image_id VARCHAR(100)
 * - cloud_cover DECIMAL(5,2)
 * - created_at TIMESTAMP
 *
 * Constraints/Indexes:
 * - UNIQUE(field_id, measurement_date)
 * - INDEX(field_id, measurement_date DESC)
 * - INDEX(health_status)
 */
const HealthRecord = sequelize.define(
  'HealthRecord',
  {
    record_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    field_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    measurement_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    ndvi_mean: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    ndvi_min: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    ndvi_max: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    ndvi_std: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    ndwi_mean: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    ndwi_min: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    ndwi_max: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    ndwi_std: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    tdvi_mean: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    health_status: {
      type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor'),
      allowNull: false,
    },
    health_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    trend: {
      type: DataTypes.ENUM('improving', 'stable', 'declining'),
      allowNull: false,
    },
    satellite_image_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    cloud_cover: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: literal('NOW()'),
    },
  },
  {
    tableName: 'health_records',
    timestamps: false, // created_at managed, no updated_at in schema
    underscored: true,
    freezeTableName: true,
    indexes: [
      // Uniqueness per (field_id, measurement_date)
      { unique: true, fields: ['field_id', 'measurement_date'] },
      // Fast latest-by-date per field
      { fields: ['field_id', { name: 'measurement_date', order: 'DESC' }] },
      // Filter by status
      { fields: ['health_status'] },
    ],
  }
);

// Optional association helper (to be wired where models are composed)
// HealthRecord.associate = (models) => {
//   HealthRecord.belongsTo(models.Field, { foreignKey: 'field_id', as: 'field' });
// };

module.exports = HealthRecord;