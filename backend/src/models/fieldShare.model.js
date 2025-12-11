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
    shareid: {
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
    ownerid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
    },
    sharedwithuser_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
    },
    permissionlevel: {
      type: DataTypes.ENUM('view', 'edit'),
      allowNull: false,
      defaultValue: 'view',
    },
    sharedat: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expiresat: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'fieldshares',
    timestamps: false,
    indexes: [
      { fields: ['field_id'] },
      { fields: ['ownerid'] },
      { fields: ['sharedwithuser_id'] },
      { unique: true, fields: ['field_id', 'sharedwithuser_id'] }, // Prevent duplicate shares
    ],
  }
);

module.exports = FieldShare;
