'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

/**
 * Field Model
 * Aligns with PostgreSQL "fields" table defined in database/init.sql
 * - Geometry columns use PostGIS (Polygon/Point, SRID 4326)
 * - Composite unique (user_id, name)
 * - Status ENUM: active | archived | deleted
 */
const Field = sequelize.define(
  'Field',
  {
    field_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    boundary: {
      // geometry(MultiPolygon, 4326) — accepts Polygon/MultiPolygon at service; stored as MultiPolygon
      type: DataTypes.GEOMETRY('MULTIPOLYGON', 4326),
      allowNull: false,
    },
    area: {
      // legacy hectares (DECIMAL(10,2)); retained for backward compatibility
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },
    area_sqm: {
      // square meters computed via ST_Area(geography) in DB trigger/service
      // allowNull: true in model because trigger sets it BEFORE INSERT
      type: DataTypes.DECIMAL, // NUMERIC
      allowNull: true, // DB constraint is NOT NULL, but trigger sets it
    },
    center: {
      // geometry(Point, 4326)
      // allowNull: true in model because trigger sets it BEFORE INSERT
      type: DataTypes.GEOMETRY('POINT', 4326),
      allowNull: true, // DB constraint is NOT NULL, but trigger sets it
    },
    status: {
      type: DataTypes.ENUM('active', 'archived', 'deleted'),
      allowNull: false,
      defaultValue: 'active',
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
    tableName: 'fields',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      // Composite unique: (user_id, name)
      { unique: true, fields: ['user_id', 'name'] },
      // Align with DB-side: user_id + status
      { fields: ['user_id', 'status'] },
      // Spatial indexes (will be no-ops if dialect unsupported; DB created via init.sql)
      { fields: ['boundary'], using: 'gist' },
      { fields: ['center'], using: 'gist' },
    ],
    defaultScope: {
      where: { status: 'active' },
    },
    scopes: {
      allStatuses: { where: {} },
    },
  }
);

// Optional association helper (to be called where models are wired together)
// Field.associate = (models) => {
//   Field.belongsTo(models.User, { foreignKey: 'user_id', as: 'owner' });
// };

module.exports = Field;