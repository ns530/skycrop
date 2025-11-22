'use strict';

const Field = require('../models/field.model');
const { Op } = require('sequelize');

/**
 * Repository for field data access
 */
class FieldRepository {
  /**
   * Find field by ID
   * @param {string} fieldId - Field UUID
   * @returns {Promise<Field|null>}
   */
  async findById(fieldId) {
    return await Field.findByPk(fieldId);
  }

  /**
   * Find fields by user ID
   * @param {string} userId - User UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array<Field>>}
   */
  async findByUserId(userId, options = {}) {
    const { status = 'active', limit = 100 } = options;

    const where = { user_id: userId };

    if (status) {
      where.status = status;
    }

    return await Field.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
    });
  }

  /**
   * Create a new field
   * @param {Object} data - Field data
   * @returns {Promise<Field>}
   */
  async create(data) {
    return await Field.create(data);
  }

  /**
   * Update a field
   * @param {string} fieldId - Field UUID
   * @param {Object} updates - Field updates
   * @returns {Promise<Field>}
   */
  async update(fieldId, updates) {
    const field = await this.findById(fieldId);
    
    if (!field) {
      const error = new Error('Field not found');
      error.statusCode = 404;
      throw error;
    }

    await field.update(updates);
    return field;
  }

  /**
   * Delete a field (soft delete by setting status to 'deleted')
   * @param {string} fieldId - Field UUID
   * @returns {Promise<boolean>}
   */
  async delete(fieldId) {
    const field = await this.findById(fieldId);
    
    if (!field) {
      return false;
    }

    await field.update({ status: 'deleted' });
    return true;
  }

  /**
   * Find fields within a bounding box
   * @param {Object} bounds - Bounding box { minLat, maxLat, minLon, maxLon }
   * @param {string} userId - Optional user UUID to filter
   * @returns {Promise<Array<Field>>}
   */
  async findWithinBounds(bounds, userId = null) {
    const { minLat, maxLat, minLon, maxLon } = bounds;
    
    const where = {
      status: 'active',
    };

    if (userId) {
      where.user_id = userId;
    }

    // Note: This is a simplified bounding box query
    // In production, use PostGIS spatial queries for accurate results
    return await Field.findAll({
      where,
      // Additional spatial filtering would go here with PostGIS
    });
  }

  /**
   * Count fields by user
   * @param {string} userId - User UUID
   * @returns {Promise<number>}
   */
  async countByUser(userId) {
    return await Field.count({
      where: {
        user_id: userId,
        status: 'active',
      },
    });
  }
}

module.exports = FieldRepository;

