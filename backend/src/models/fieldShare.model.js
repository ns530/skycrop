'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

/**
 * Field Share Model
 * Represents shared access to fields between users
 */
const FieldShare = sequelize.define(
  'FieldShare',
  {
    share_id: {
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
      onDelete: 'CASCADE',
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
    },
    shared_with_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
    },
    permission_level: {
      type: DataTypes.ENUM('view', 'edit'),
      allowNull: false,
      defaultValue: 'view',
    },
    shared_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'field_shares',
    timestamps: false,
    indexes: [
      { fields: ['field_id'] },
      { fields: ['owner_id'] },
      { fields: ['shared_with_user_id'] },
      { unique: true, fields: ['field_id', 'shared_with_user_id'] }, // Prevent duplicate shares
    ],
  }
);

module.exports = FieldShare;

