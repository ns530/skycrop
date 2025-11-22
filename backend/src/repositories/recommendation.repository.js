'use strict';

const Recommendation = require('../models/recommendation.model');
const { Op } = require('sequelize');

/**
 * Repository for recommendation data access
 */
class RecommendationRepository {
  /**
   * Create a new recommendation
   * @param {Object} data - Recommendation data
   * @returns {Promise<Recommendation>}
   */
  async create(data) {
    return await Recommendation.create(data);
  }

  /**
   * Find recommendations by field ID
   * @param {string} fieldId - Field UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array<Recommendation>>}
   */
  async findByFieldId(fieldId, options = {}) {
    const { status, priority, validOnly = false, limit = 50 } = options;

    const where = { field_id: fieldId };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (validOnly) {
      where.valid_until = {
        [Op.gte]: new Date(),
      };
    }

    return await Recommendation.findAll({
      where,
      order: [
        ['urgency_score', 'DESC'],
        ['generated_at', 'DESC'],
      ],
      limit,
    });
  }

  /**
   * Find recommendations by user ID
   * @param {string} userId - User UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array<Recommendation>>}
   */
  async findByUserId(userId, options = {}) {
    const { status, priority, validOnly = false, limit = 100 } = options;

    const where = { user_id: userId };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (validOnly) {
      where.valid_until = {
        [Op.gte]: new Date(),
      };
    }

    return await Recommendation.findAll({
      where,
      order: [
        ['urgency_score', 'DESC'],
        ['generated_at', 'DESC'],
      ],
      limit,
    });
  }

  /**
   * Find recommendation by ID
   * @param {string} recommendationId - Recommendation UUID
   * @returns {Promise<Recommendation|null>}
   */
  async findById(recommendationId) {
    return await Recommendation.findByPk(recommendationId);
  }

  /**
   * Update recommendation status
   * @param {string} recommendationId - Recommendation UUID
   * @param {string} status - New status
   * @param {string} notes - Optional notes
   * @returns {Promise<Recommendation>}
   */
  async updateStatus(recommendationId, status, notes = null) {
    const recommendation = await this.findById(recommendationId);
    
    if (!recommendation) {
      const error = new Error('Recommendation not found');
      error.statusCode = 404;
      throw error;
    }

    const updates = { status };
    
    if (status === 'in_progress' || status === 'completed') {
      updates.actioned_at = new Date();
    }

    if (notes) {
      updates.notes = notes;
    }

    await recommendation.update(updates);
    return recommendation;
  }

  /**
   * Delete recommendation
   * @param {string} recommendationId - Recommendation UUID
   * @returns {Promise<boolean>}
   */
  async delete(recommendationId) {
    const result = await Recommendation.destroy({
      where: { recommendation_id: recommendationId },
    });
    return result > 0;
  }

  /**
   * Get statistics for a field
   * @param {string} fieldId - Field UUID
   * @returns {Promise<Object>}
   */
  async getStatistics(fieldId) {
    const all = await this.findByFieldId(fieldId, { limit: 1000 });
    
    return {
      total: all.length,
      pending: all.filter((r) => r.status === 'pending').length,
      inProgress: all.filter((r) => r.status === 'in_progress').length,
      completed: all.filter((r) => r.status === 'completed').length,
      dismissed: all.filter((r) => r.status === 'dismissed').length,
      critical: all.filter((r) => r.priority === 'critical').length,
      high: all.filter((r) => r.priority === 'high').length,
      medium: all.filter((r) => r.priority === 'medium').length,
      low: all.filter((r) => r.priority === 'low').length,
    };
  }
}

module.exports = RecommendationRepository;

