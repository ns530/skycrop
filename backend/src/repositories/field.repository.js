const Field = require('../models/field.model');

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
    return Field.findByPk(fieldId);
  }

  /**
   * Find fields by user ID
   * @param {string} userId - User UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array<Field>>}
   */
  async findByUserId(userId, options = {}) {
    const { status = 'active', limit = 100 } = options;

    const where = { userId };

    if (status) {
      where.status = status;
    }

    return Field.findAll({
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
    return Field.create(data);
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
    const { minLat: _minLat, maxLat: _maxLat, minLon: _minLon, maxLon: _maxLon } = bounds;

    const where = {
      status: 'active',
    };

    if (userId) {
      where.userId = userId;
    }

    // Note: This is a simplified bounding box query
    // In production, use PostGIS spatial queries for accurate results
    return Field.findAll({
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
    return Field.count({
      where: {
        userId,
        status: 'active',
      },
    });
  }
}

module.exports = FieldRepository;
