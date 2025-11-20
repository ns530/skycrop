'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');

/**
 * User Model
 * Mirrors PostgreSQL "users" table created by init.sql
 */
const User = sequelize.define(
  'User',
  {
    user_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true, len: [3, 255] },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true, // null for OAuth users
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('farmer', 'admin'),
      allowNull: false,
      defaultValue: 'farmer',
    },
    auth_provider: {
      type: DataTypes.ENUM('google', 'email'),
      allowNull: false,
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    profile_photo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'deleted'),
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
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      // Align with DB-side conditional indexes where possible
      { fields: ['email'] },
      { fields: ['status', 'created_at'] },
      { fields: ['last_login'] },
    ],
    defaultScope: {
      where: { status: 'active' },
      attributes: {
        // do not expose password hash by default
        exclude: ['password_hash'],
      },
    },
    scopes: {
      withSensitive: {
        attributes: { include: ['password_hash'] },
      },
      allStatuses: {
        where: {},
      },
    },
  }
);

/**
 * Helper: find active user by email
 * @param {string} email
 * @returns {Promise<User|null>}
 */
User.findByEmail = function findByEmail(email) {
  return this.scope('allStatuses').findOne({ where: { email } });
};

/**
 * Helper: soft-delete user by setting status
 * @param {string} userId
 * @returns {Promise<[affectedCount]>}
 */
User.softDeleteById = function softDeleteById(userId) {
  return this.update(
    { status: 'deleted' },
    {
      where: { user_id: userId },
      returning: false,
    }
  );
};

module.exports = User;