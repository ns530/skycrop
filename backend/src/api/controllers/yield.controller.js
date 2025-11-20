'use strict';

const { getYieldService } = require('../../services/yield.service');
const { logger } = require('../../utils/logger');

const yieldService = getYieldService();

/**
 * Yield Controller
 * Handles HTTP requests for actual yield data (farmer-entered harvest data)
 */
module.exports = {
  /**
   * POST /api/v1/fields/:fieldId/yield
   * Create a new yield entry for a field
   */
  async create(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;

    try {
      const userId = req.user.userId;
      const { fieldId } = req.params;
      const yieldData = req.body;

      const result = await yieldService.create(userId, fieldId, yieldData);

      const latency = Date.now() - started;
      logger.info('yields.create', {
        route: `/api/v1/fields/${fieldId}/yield`,
        method: 'POST',
        user_id: userId,
        field_id: fieldId,
        yield_id: result.yield_id,
        correlation_id: correlationId,
        latency_ms: latency,
      });

      return res.status(201).json({
        success: true,
        data: result,
        meta: { correlation_id: correlationId, latency_ms: latency },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/v1/fields/:fieldId/yield
   * Get all yield entries for a field (with pagination)
   */
  async listByField(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;

    try {
      const userId = req.user.userId;
      const { fieldId } = req.params;
      const options = req.query || {};

      const result = await yieldService.listByField(userId, fieldId, options);

      const latency = Date.now() - started;
      logger.info('yields.listByField', {
        route: `/api/v1/fields/${fieldId}/yield`,
        method: 'GET',
        user_id: userId,
        field_id: fieldId,
        page: result.page,
        page_size: result.pageSize,
        total: result.total,
        cache_hit: result.cacheHit,
        correlation_id: correlationId,
        latency_ms: latency,
      });

      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          page: result.page,
          page_size: result.pageSize,
          total: result.total,
          total_pages: result.totalPages,
        },
        meta: {
          correlation_id: correlationId,
          latency_ms: latency,
          cache_hit: result.cacheHit,
        },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/v1/fields/:fieldId/yield/statistics
   * Get yield statistics for a field
   */
  async getStatistics(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;

    try {
      const userId = req.user.userId;
      const { fieldId } = req.params;

      const result = await yieldService.getStatistics(userId, fieldId);

      const latency = Date.now() - started;
      logger.info('yields.getStatistics', {
        route: `/api/v1/fields/${fieldId}/yield/statistics`,
        method: 'GET',
        user_id: userId,
        field_id: fieldId,
        correlation_id: correlationId,
        latency_ms: latency,
      });

      return res.status(200).json({
        success: true,
        data: result,
        meta: { correlation_id: correlationId, latency_ms: latency },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/v1/yield/:yieldId
   * Get a single yield entry by ID
   */
  async getById(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;

    try {
      const userId = req.user.userId;
      const { yieldId } = req.params;

      const result = await yieldService.getById(userId, yieldId);

      const latency = Date.now() - started;
      logger.info('yields.getById', {
        route: `/api/v1/yield/${yieldId}`,
        method: 'GET',
        user_id: userId,
        yield_id: yieldId,
        correlation_id: correlationId,
        latency_ms: latency,
      });

      return res.status(200).json({
        success: true,
        data: result,
        meta: { correlation_id: correlationId, latency_ms: latency },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * PATCH /api/v1/yield/:yieldId
   * Update a yield entry
   */
  async update(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;

    try {
      const userId = req.user.userId;
      const { yieldId } = req.params;
      const updates = req.body;

      const result = await yieldService.update(userId, yieldId, updates);

      const latency = Date.now() - started;
      logger.info('yields.update', {
        route: `/api/v1/yield/${yieldId}`,
        method: 'PATCH',
        user_id: userId,
        yield_id: yieldId,
        correlation_id: correlationId,
        latency_ms: latency,
      });

      return res.status(200).json({
        success: true,
        data: result,
        meta: { correlation_id: correlationId, latency_ms: latency },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * DELETE /api/v1/yield/:yieldId
   * Delete a yield entry
   */
  async remove(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;

    try {
      const userId = req.user.userId;
      const { yieldId } = req.params;

      await yieldService.remove(userId, yieldId);

      const latency = Date.now() - started;
      logger.info('yields.remove', {
        route: `/api/v1/yield/${yieldId}`,
        method: 'DELETE',
        user_id: userId,
        yield_id: yieldId,
        correlation_id: correlationId,
        latency_ms: latency,
      });

      return res.status(200).json({
        success: true,
        message: 'Yield entry deleted successfully',
        meta: { correlation_id: correlationId, latency_ms: latency },
      });
    } catch (err) {
      return next(err);
    }
  },
};

