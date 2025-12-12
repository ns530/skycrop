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
   * POST /api/v1/fields/:field_id/yield
   * Create a new yield entry for a field
   */
  async create(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;

    try {
      const { user_id } = req.user;
      const { field_id } = req.params;
      const yieldData = req.body;

      const result = await yieldService.create(user_id, field_id, yieldData);

      const latency = Date.now() - started;
      logger.info('yields.create', {
        route: `/api/v1/fields/${field_id}/yield`,
        method: 'POST',
        user_id,
        field_id,
        yieldid: result.yieldid,
        correlationid: correlationId,
        latencyms: latency,
      });

      return res.status(201).json({
        success: true,
        data: result,
        meta: { correlationid: correlationId, latencyms: latency },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/v1/fields/:field_id/yield
   * Get all yield entries for a field (with pagination)
   */
  async listByField(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;

    try {
      const { user_id } = req.user;
      const { field_id } = req.params;
      const options = req.query || {};

      const result = await yieldService.listByField(user_id, field_id, options);

      const latency = Date.now() - started;
      logger.info('yields.listByField', {
        route: `/api/v1/fields/${field_id}/yield`,
        method: 'GET',
        user_id,
        field_id,
        page: result.page,
        pagesize: result.pageSize,
        total: result.total,
        cachehit: result.cacheHit,
        correlationid: correlationId,
        latencyms: latency,
      });

      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          page: result.page,
          pagesize: result.pageSize,
          total: result.total,
          totalpages: result.totalPages,
        },
        meta: {
          correlationid: correlationId,
          latencyms: latency,
          cachehit: result.cacheHit,
        },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/v1/fields/:field_id/yield/statistics
   * Get yield statistics for a field
   */
  async getStatistics(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;

    try {
      const { user_id } = req.user;
      const { field_id } = req.params;

      const result = await yieldService.getStatistics(user_id, field_id);

      const latency = Date.now() - started;
      logger.info('yields.getStatistics', {
        route: `/api/v1/fields/${field_id}/yield/statistics`,
        method: 'GET',
        user_id,
        field_id,
        correlationid: correlationId,
        latencyms: latency,
      });

      return res.status(200).json({
        success: true,
        data: result,
        meta: { correlationid: correlationId, latencyms: latency },
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
      const { user_id } = req.user;
      const { yieldId } = req.params;

      const result = await yieldService.getById(user_id, yieldId);

      const latency = Date.now() - started;
      logger.info('yields.getById', {
        route: `/api/v1/yield/${yieldId}`,
        method: 'GET',
        user_id,
        yieldid: yieldId,
        correlationid: correlationId,
        latencyms: latency,
      });

      return res.status(200).json({
        success: true,
        data: result,
        meta: { correlationid: correlationId, latencyms: latency },
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
      const { user_id } = req.user;
      const { yieldId } = req.params;
      const updates = req.body;

      const result = await yieldService.update(user_id, yieldId, updates);

      const latency = Date.now() - started;
      logger.info('yields.update', {
        route: `/api/v1/yield/${yieldId}`,
        method: 'PATCH',
        user_id,
        yieldid: yieldId,
        correlationid: correlationId,
        latencyms: latency,
      });

      return res.status(200).json({
        success: true,
        data: result,
        meta: { correlationid: correlationId, latencyms: latency },
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
      const { user_id } = req.user;
      const { yieldId } = req.params;

      await yieldService.remove(user_id, yieldId);

      const latency = Date.now() - started;
      logger.info('yields.remove', {
        route: `/api/v1/yield/${yieldId}`,
        method: 'DELETE',
        user_id,
        yieldid: yieldId,
        correlationid: correlationId,
        latencyms: latency,
      });

      return res.status(200).json({
        success: true,
        message: 'Yield entry deleted successfully',
        meta: { correlationid: correlationId, latencyms: latency },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/v1/fields/:field_id/yield/predict
   * Generate yield prediction for a field
   */
  async predictYield(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;

    try {
      const { user_id } = req.user;
      const { field_id } = req.params;
      const predictionOptions = req.body || {};

      const result = await yieldService.predictYield(user_id, field_id, predictionOptions);

      const latency = Date.now() - started;
      logger.info('yields.predict', {
        route: `/api/v1/fields/${field_id}/yield/predict`,
        method: 'POST',
        user_id,
        field_id,
        predictionid: result.predictionid,
        predictedyield: result.predictedyieldperha,
        correlationid: correlationId,
        latencyms: latency,
      });

      return res.status(200).json({
        success: true,
        data: result,
        meta: { correlationid: correlationId, latencyms: latency },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /api/v1/fields/:field_id/yield/predictions
   * Get all yield predictions for a field
   */
  async getPredictions(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;

    try {
      const { user_id } = req.user;
      const { field_id } = req.params;
      const options = req.query || {};

      const result = await yieldService.getPredictions(user_id, field_id, options);

      const latency = Date.now() - started;
      logger.info('yields.getPredictions', {
        route: `/api/v1/fields/${field_id}/yield/predictions`,
        method: 'GET',
        user_id,
        field_id,
        count: result.predictions.length,
        cachehit: result.cacheHit,
        correlationid: correlationId,
        latencyms: latency,
      });

      return res.status(200).json({
        success: true,
        data: result.predictions,
        meta: {
          correlationid: correlationId,
          latencyms: latency,
          cachehit: result.cacheHit,
          count: result.predictions.length,
        },
      });
    } catch (err) {
      return next(err);
    }
  },
};
