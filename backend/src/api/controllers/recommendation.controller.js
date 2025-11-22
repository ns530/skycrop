'use strict';

const { AppError } = require('../../errors/custom-errors');

/**
 * Recommendation Controller
 * Handles HTTP requests for recommendation engine
 */
class RecommendationController {
  constructor(recommendationEngineService, recommendationRepository, fieldModel) {
    this.recommendationEngineService = recommendationEngineService;
    this.recommendationRepository = recommendationRepository;
    this.Field = fieldModel;
  }

  /**
   * Generate recommendations for a field
   * POST /api/v1/fields/:fieldId/recommendations/generate
   */
  async generateRecommendations(req, res, next) {
    try {
      const { fieldId } = req.params;
      const userId = req.user.userId;

      const result = await this.recommendationEngineService.generateRecommendations(fieldId, userId);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          correlationId: req.id,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recommendations for a field
   * GET /api/v1/fields/:fieldId/recommendations
   */
  async getFieldRecommendations(req, res, next) {
    try {
      const { fieldId } = req.params;
      const userId = req.user.userId;
      const { status, priority, validOnly } = req.query;

      // Verify field ownership
      const field = await this.Field.findByPk(fieldId);
      if (!field) {
        throw new AppError('FIELD_NOT_FOUND', `Field with ID ${fieldId} not found`, 404);
      }
      if (field.user_id !== userId) {
        throw new AppError('FORBIDDEN', 'You do not have access to this field', 403);
      }

      const recommendations = await this.recommendationRepository.findByFieldId(fieldId, {
        status,
        priority,
        validOnly: validOnly === 'true',
      });

      const stats = await this.recommendationRepository.getStatistics(fieldId);

      res.status(200).json({
        success: true,
        data: {
          fieldId,
          recommendations: recommendations.map((r) => this._formatRecommendation(r)),
          statistics: stats,
        },
        meta: {
          correlationId: req.id,
          count: recommendations.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all recommendations for a user
   * GET /api/v1/recommendations
   */
  async getUserRecommendations(req, res, next) {
    try {
      const userId = req.user.userId;
      const { status, priority, validOnly } = req.query;

      const recommendations = await this.recommendationRepository.findByUserId(userId, {
        status,
        priority,
        validOnly: validOnly === 'true',
      });

      res.status(200).json({
        success: true,
        data: {
          recommendations: recommendations.map((r) => this._formatRecommendation(r)),
        },
        meta: {
          correlationId: req.id,
          count: recommendations.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update recommendation status
   * PATCH /api/v1/recommendations/:recommendationId/status
   */
  async updateRecommendationStatus(req, res, next) {
    try {
      const { recommendationId } = req.params;
      const { status, notes } = req.body;
      const userId = req.user.userId;

      if (!status) {
        throw new AppError('VALIDATION_ERROR', 'Status is required', 400);
      }

      const validStatuses = ['pending', 'in_progress', 'completed', 'dismissed'];
      if (!validStatuses.includes(status)) {
        throw new AppError(
          'VALIDATION_ERROR',
          `Status must be one of: ${validStatuses.join(', ')}`,
          400
        );
      }

      // Verify recommendation exists and user owns the associated field
      const recommendation = await this.recommendationRepository.findById(recommendationId);
      if (!recommendation) {
        throw new AppError('NOT_FOUND', 'Recommendation not found', 404);
      }

      if (recommendation.user_id !== userId) {
        throw new AppError('FORBIDDEN', 'You do not have access to this recommendation', 403);
      }

      const updated = await this.recommendationRepository.updateStatus(
        recommendationId,
        status,
        notes
      );

      res.status(200).json({
        success: true,
        data: this._formatRecommendation(updated),
        meta: {
          correlationId: req.id,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete recommendation
   * DELETE /api/v1/recommendations/:recommendationId
   */
  async deleteRecommendation(req, res, next) {
    try {
      const { recommendationId } = req.params;
      const userId = req.user.userId;

      // Verify recommendation exists and user owns the associated field
      const recommendation = await this.recommendationRepository.findById(recommendationId);
      if (!recommendation) {
        throw new AppError('NOT_FOUND', 'Recommendation not found', 404);
      }

      if (recommendation.user_id !== userId) {
        throw new AppError('FORBIDDEN', 'You do not have access to this recommendation', 403);
      }

      await this.recommendationRepository.delete(recommendationId);

      res.status(200).json({
        success: true,
        message: 'Recommendation deleted successfully',
        meta: {
          correlationId: req.id,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Format recommendation for API response
   * @private
   */
  _formatRecommendation(rec) {
    return {
      recommendationId: rec.recommendation_id,
      fieldId: rec.field_id,
      type: rec.type,
      priority: rec.priority,
      urgency: rec.urgency_score,
      title: rec.title,
      description: rec.description,
      reason: rec.reason,
      actionSteps: rec.action_steps ? JSON.parse(rec.action_steps) : [],
      estimatedCost: rec.estimated_cost ? parseFloat(rec.estimated_cost) : null,
      expectedBenefit: rec.expected_benefit,
      timing: rec.timing,
      validUntil: rec.valid_until,
      status: rec.status,
      generatedAt: rec.generated_at,
      actionedAt: rec.actioned_at,
      notes: rec.notes,
    };
  }
}

module.exports = RecommendationController;
