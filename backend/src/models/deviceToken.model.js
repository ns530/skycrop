'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

/**
 * DeviceToken Model
 * Stores FCM device tokens for push notifications
 */
const DeviceToken = sequelize.define(
  'DeviceToken',
  {
    token_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    device_token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    platform: {
      type: DataTypes.ENUM('android', 'ios'),
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    last_used: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    tableName: 'device_tokens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['device_token'],
        unique: true,
      },
      {
        fields: ['user_id', 'active'],
      },
    ],
  }
);

module.exports = DeviceToken;

