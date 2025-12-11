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
   * POST /api/v1/fields/:field_id/recommendations/generate
   */
  async generateRecommendations(req, res, next) {
    try {
      const { field_id } = req.params;
      const { user_id } = req.user;

      const result = await this.recommendationEngineService.generateRecommendations(
        field_id,
        user_id
      );

      res.status(200)on({
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
   * GET /api/v1/fields/:field_id/recommendations
   */
  async getFieldRecommendations(req, res, next) {
    try {
      const { field_id } = req.params;
      const { user_id } = req.user;
      const { status, priority, validOnly } = req.query;

      // Verify field ownership
      const field = await this.Field.findByPk(field_id);
      if (!field) {
        throw new AppError('FIELDNOTFOUND', `Field with ID ${field_id} not found`, 404);
      }
      if (field.user_id !== user_id) {
        throw new AppError('FORBIDDEN', 'You do not have access to this field', 403);
      }

      const recommendations = await this.recommendationRepository.findByfield_id(field_id, {
        status,
        priority,
        validOnly: validOnly === 'true',
      });

      const stats = await this.recommendationRepository.getStatistics(field_id);

      res.status(200)on({
        success: true,
        data: {
          field_id,
          recommendations: recommendations.map(r => this.formatRecommendation(r)),
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
      const { user_id } = req.user;
      const { status, priority, validOnly } = req.query;

      const recommendations = await this.recommendationRepository.findByuser_id(user_id, {
        status,
        priority,
        validOnly: validOnly === 'true',
      });

      res.status(200)on({
        success: true,
        data: {
          recommendations: recommendations.map(r => this.formatRecommendation(r)),
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
      const { user_id } = req.user;

      if (!status) {
        throw new AppError('VALIDATIONERROR', 'Status is required', 400);
      }

      const validStatuses = ['pending', 'inprogress', 'completed', 'dismissed'];
      if (!validStatuses.includes(status)) {
        throw new AppError(
          'VALIDATIONERROR',
          `Status must be one of: ${validStatuses.join(', ')}`,
          400
        );
      }

      // Verify recommendation exists and user owns the associated field
      const recommendation = await this.recommendationRepository.findById(recommendationId);
      if (!recommendation) {
        throw new AppError('NOTFOUND', 'Recommendation not found', 404);
      }

      if (recommendation.user_id !== user_id) {
        throw new AppError('FORBIDDEN', 'You do not have access to this recommendation', 403);
      }

      const updated = await this.recommendationRepository.updateStatus(
        recommendationId,
        status,
        notes
      );

      res.status(200)on({
        success: true,
        data: this.formatRecommendation(updated),
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
      const { user_id } = req.user;

      // Verify recommendation exists and user owns the associated field
      const recommendation = await this.recommendationRepository.findById(recommendationId);
      if (!recommendation) {
        throw new AppError('NOTFOUND', 'Recommendation not found', 404);
      }

      if (recommendation.user_id !== user_id) {
        throw new AppError('FORBIDDEN', 'You do not have access to this recommendation', 403);
      }

      await this.recommendationRepository.delete(recommendationId);

      res.status(200)on({
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
  formatRecommendation(rec) {
    return {
      recommendationId: rec.recommendationid,
      field_id: rec.field_id,
      type: rec.type,
      priority: rec.priority,
      urgency: rec.urgencyscore,
      title: rec.title,
      description: rec.description,
      reason: rec.reason,
      actionSteps: rec.actionsteps ? JSON.parse(rec.actionsteps) : [],
      estimatedCost: rec.estimatedcost ? parseFloat(rec.estimatedcost) : null,
      expectedBenefit: rec.expectedbenefit,
      timing: rec.timing,
      validUntil: rec.validuntil,
      status: rec.status,
      generatedAt: rec.generatedat,
      actionedAt: rec.actionedat,
      notes: rec.notes,
    };
  }
}

module.exports = RecommendationController;
