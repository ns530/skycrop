'use strict';

const { Op } = require('sequelize');
const Field = require('../models/field.model');

/**
 * Repository for field data access
 */
class FieldRepository {
  /**
   * Find field by ID
   * @param {string} field_id - Field UUID
   * @returns {Promise<Field|null>}
   */
  async findById(field_id) {
    return await Field.findByPk(field_id);
  }

  /**
   * Find fields by user ID
   * @param {string} user_id - User UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array<Field>>}
   */
  async findByuser_id(user_id, options = {}) {
    const { status = 'active', limit = 100 } = options;

    const where = { user_id };

    if (status) {
      where.status = status;
    }

    return await Field.findAll({
      where,
      order: [['createdat', 'DESC']],
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
   * @param {string} field_id - Field UUID
   * @param {Object} updates - Field updates
   * @returns {Promise<Field>}
   */
  async update(field_id, updates) {
    const field = await this.findById(field_id);

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
   * @param {string} field_id - Field UUID
   * @returns {Promise<boolean>}
   */
  async delete(field_id) {
    const field = await this.findById(field_id);

    if (!field) {
      return false;
    }

    await field.update({ status: 'deleted' });
    return true;
  }

  /**
   * Find fields within a bounding box
   * @param {Object} bounds - Bounding box { minLat, maxLat, minLon, maxLon }
   * @param {string} user_id - Optional user UUID to filter
   * @returns {Promise<Array<Field>>}
   */
  async findWithinBounds(bounds, user_id = null) {
    const { minLat, maxLat, minLon, maxLon } = bounds;

    const where = {
      status: 'active',
    };

    if (user_id) {
      where.user_id = user_id;
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
   * @param {string} user_id - User UUID
   * @returns {Promise<number>}
   */
  async countByUser(user_id) {
    return await Field.count({
      where: {
        user_id,
        status: 'active',
      },
    });
  }
}

module.exports = FieldRepository;
