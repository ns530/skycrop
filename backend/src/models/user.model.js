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
    passwordhash: {
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
      type: DataTypes.ENUM('admin', 'manager', 'farmer', 'viewer'),
      allowNull: false,
      defaultValue: 'farmer',
    },
    authprovider: {
      type: DataTypes.ENUM('google', 'email'),
      allowNull: false,
    },
    emailverified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    profilephotourl: {
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
    createdat: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedat: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    lastlogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    createdAt: 'createdat',
    updatedAt: 'updatedat',
    underscored: true,
    freezeTableName: true,
    indexes: [
      // Align with DB-side conditional indexes where possible
      { fields: ['email'] },
      { fields: ['status', 'createdat'] },
      { fields: ['lastlogin'] },
    ],
    defaultScope: {
      where: { status: 'active' },
      attributes: {
        // do not expose password hash by default
        exclude: ['passwordhash'],
      },
    },
    scopes: {
      withSensitive: {
        attributes: { include: ['passwordhash'] },
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
 * @param {string} user_id
 * @returns {Promise<[affectedCount]>}
 */
User.softDeleteById = function softDeleteById(user_id) {
  return this.update(
    { status: 'deleted' },
    {
      where: { user_id: user_id },
      returning: false,
    }
  );
};

module.exports = User;
