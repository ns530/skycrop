const { DataTypes, literal } = require('sequelize');
const { sequelize } = require('../config/database.config');

/**
 * HealthRecord Model
 * Mirrors PostgreSQL "healthrecords" table defined in database/init.sql
 *
 * Columns:
 * - recordid UUID PK
 * - field_id UUID FK (fields.field_id)
 * - measurementdate DATE
 * - ndvi_* / ndwi_* / tdvimean DECIMAL(5,4)
 * - healthstatus ENUM('excellent','good','fair','poor')
 * - healthscore INTEGER (0-100)
 * - trend ENUM('improving','stable','declining')
 * - satelliteimageid VARCHAR(100)
 * - cloudcover DECIMAL(5,2)
 * - createdat TIMESTAMP
 *
 * Constraints/Indexes:
 * - UNIQUE(field_id, measurementdate)
 * - INDEX(field_id, measurementdate DESC)
 * - INDEX(healthstatus)
 */
const HealthRecord = sequelize.define(
  'HealthRecord',
  {
    recordid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'record_id',
    },
    field_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    measurementdate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'measurement_date',
    },
    ndvimean: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      field: 'ndvi_mean',
    },
    ndvimin: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      field: 'ndvi_min',
    },
    ndvimax: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      field: 'ndvi_max',
    },
    ndvistd: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      field: 'ndvi_std',
    },
    ndwimean: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      field: 'ndwi_mean',
    },
    ndwimin: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      field: 'ndwi_min',
    },
    ndwimax: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      field: 'ndwi_max',
    },
    ndwistd: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      field: 'ndwi_std',
    },
    tdvimean: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      field: 'tdvi_mean',
    },
    healthstatus: {
      type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor'),
      allowNull: false,
      field: 'health_status',
    },
    healthscore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'health_score',
      validate: {
        min: 0,
        max: 100,
      },
    },
    trend: {
      type: DataTypes.ENUM('improving', 'stable', 'declining'),
      allowNull: false,
    },
    satelliteimageid: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'satellite_image_id',
    },
    cloudcover: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      field: 'cloud_cover',
    },
    createdat: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: literal('NOW()'),
      field: 'created_at',
    },
  },
  {
    tableName: 'health_records',
    timestamps: false, // createdat managed, no updatedat in schema
    underscored: true,
    freezeTableName: true,
    indexes: [
      // Uniqueness per (field_id, measurementdate)
      { unique: true, fields: ['field_id', 'measurementdate'] },
      // Fast latest-by-date per field
      { fields: ['field_id', { name: 'measurementdate', order: 'DESC' }] },
      // Filter by status
      { fields: ['healthstatus'] },
    ],
  }
);

// Optional association helper (to be wired where models are composed)
// HealthRecord.associate = (models) => {
//   HealthRecord.belongsTo(models.Field, { foreignKey: 'field_id', as: 'field' });
// };

module.exports = HealthRecord;
