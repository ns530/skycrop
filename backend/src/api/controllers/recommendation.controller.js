'use strict';

const { v4: uuidv4 } = require('uuid');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../../config/database.config');
const { logger } = require('../../utils/logger');
const { ValidationError } = require('../../errors/custom-errors');
const { getRecommendationService } = require('../../services/recommendation.service');

const recommendationService = getRecommendationService();

/**
 * Count existing recommendations for a field on a specific date (by any type)
 */
async function _countExistingForDate(fieldId, date) {
  const rows = await sequelize.query(
    `
      SELECT COUNT(*)::int AS cnt
      FROM recommendations
      WHERE field_id = :fieldId
        AND "timestamp" >= :from
        AND "timestamp" <= :to
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        fieldId,
        from: `${date}T00:00:00.000Z`,
        to: `${date}T23:59:59.999Z`,
      },
    }
  );
  return rows?.[0]?.cnt || 0;
}

module.exports = {
  /**
   * POST /api/v1/fields/:id/recommendations/compute
   * Body: { date: 'YYYY-MM-DD', recompute?: boolean }
   * Orchestrates compute + upsert, responds 201 on first create else 200.
   */
  async computeForField(req, res, next) {
    const t0 = Date.now();
    const correlationId = req.headers['x-correlation-id'] || uuidv4();

    try {
      const userId = req.user?.userId;
      const fieldId = req.params.id;
      const { date, recompute = false } = req.body || {};

      if (!fieldId) throw new ValidationError('Missing field id');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) {
        throw new ValidationError('date must be YYYY-MM-DD', { field: 'date' });
      }

      const preCount = await _countExistingForDate(fieldId, date);

      const result = await recommendationService.computeRecommendationsForField(userId, fieldId, date, { recompute });
      const persisted = await recommendationService.upsertRecommendations(fieldId, date, result.recommendations, {
        recompute,
      });

      const postCount = await _countExistingForDate(fieldId, date);
      const createdNow = preCount === 0 && postCount > 0;
      const status = createdNow ? 201 : 200;

      // Collect severity summary
      const severities = persisted.map((p) => ({ type: p.type, severity: p.severity }));
      const rulesFired = Array.isArray(result?.meta?.rules_fired) ? result.meta.rules_fired : [];

      logger.info('recommendations.compute.upsert', {
        correlation_id: correlationId,
        route: 'POST /api/v1/fields/:id/recommendations/compute',
        field_id: fieldId,
        date,
        cache_hit: !!result?.meta?.cache_hit,
        rules_fired: rulesFired,
        severities,
        latency_ms: Date.now() - t0,
      });

      return res.status(status).json({
        success: true,
        data: persisted,
        meta: {
          correlation_id: correlationId,
          latency_ms: Date.now() - t0,
          cache_hit: !!result?.meta?.cache_hit,
        },
      });
    } catch (err) {
      err.correlation_id = correlationId;
      return next(err);
    }
  },

  /**
   * GET /api/v1/fields/:id/recommendations?from=&to=&type=&page=&pageSize=
   */
  async listForField(req, res, next) {
    const t0 = Date.now();
    const correlationId = req.headers['x-correlation-id'] || uuidv4();

    try {
      const fieldId = req.params.id;
      const { from, to, type, page, pageSize } = req.query || {};
      if (!fieldId) throw new ValidationError('Missing field id');

      const payload = await recommendationService.listRecommendations(fieldId, {
        from,
        to,
        type,
        page,
        pageSize,
      });

      // Severity quick summary for logging
      const sevSummary = (payload.data || []).map((r) => ({ type: r.type, severity: r.severity }));

      logger.info('recommendations.list', {
        correlation_id: correlationId,
        route: 'GET /api/v1/fields/:id/recommendations',
        field_id: fieldId,
        from,
        to,
        type,
        count: payload.data?.length || 0,
        latency_ms: Date.now() - t0,
      });

      return res.status(200).json({
        success: true,
        data: payload.data,
        pagination: payload.pagination,
        meta: {
          correlation_id: correlationId,
          severity: sevSummary,
        },
      });
    } catch (err) {
      err.correlation_id = correlationId;
      return next(err);
    }
  },
};