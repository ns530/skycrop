'use strict';

const { getFieldService } = require('../../services/field.service');
const { logger } = require('../../utils/logger');

const fieldService = getFieldService();

/**
 * Field Controller
 * Handles CRUD and boundary operations for fields.
 */
module.exports = {
  // GET /api/v1/fields
  async list(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;
    try {
      const userId = req.user.userId;
      const result = await fieldService.list(userId, req.query || {});
      const { items, total, page, pageSize, cacheHit } = {
        items: result.items || result.data || [],
        total: result.total || 0,
        page: result.page || 1,
        pageSize: result.pageSize || 20,
        cacheHit: result.cacheHit || false,
      };

      const latency = Date.now() - started;
      logger.info('fields.list', {
        route: '/api/v1/fields',
        method: 'GET',
        user_id: userId,
        correlation_id: correlationId,
        latency_ms: latency,
        cache_hit: cacheHit,
      });

      return res.status(200).json({
        success: true,
        data: items,
        pagination: { page, page_size: pageSize, total },
        meta: { correlation_id: correlationId, latency_ms: latency, cache_hit: cacheHit },
      });
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/v1/fields
  async create(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;
    try {
      const userId = req.user.userId;
      const { name, boundary } = req.body || {};
      const data = await fieldService.createWithBoundary(userId, name, boundary);

      const latency = Date.now() - started;
      logger.info('fields.create', {
        route: '/api/v1/fields',
        method: 'POST',
        user_id: userId,
        correlation_id: correlationId,
        latency_ms: latency,
      });

      return res
        .status(201)
        .json({ success: true, data, meta: { correlation_id: correlationId, latency_ms: latency } });
    } catch (err) {
      return next(err);
    }
  },

  // GET /api/v1/fields/:id
  async getById(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const data = await fieldService.getById(userId, id);

      const latency = Date.now() - started;
      logger.info('fields.getById', {
        route: '/api/v1/fields/{id}',
        method: 'GET',
        user_id: userId,
        field_id: id,
        correlation_id: correlationId,
        latency_ms: latency,
      });

      return res.status(200).json({ success: true, data, meta: { correlation_id: correlationId, latency_ms: latency } });
    } catch (err) {
      return next(err);
    }
  },

  // PUT /api/v1/fields/:id
  async update(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { name, status } = req.body || {};
      const data = await fieldService.update(userId, id, { name, status });
      const latency = Date.now() - started;
      logger.info('fields.update', {
        route: '/api/v1/fields/{id}',
        method: 'PATCH',
        user_id: userId,
        field_id: id,
        correlation_id: correlationId,
        latency_ms: latency,
      });
      return res.status(200).json({ success: true, data, meta: { correlation_id: correlationId, latency_ms: latency } });
    } catch (err) {
      return next(err);
    }
  },

  // PUT /api/v1/fields/:id/boundary
  async updateBoundary(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { boundary } = req.body || {};
      const data = await fieldService.updateBoundary(userId, id, boundary);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/v1/fields/:id/archive
  async archive(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const data = await fieldService.archive(userId, id);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return next(err);
    }
  },

  // DELETE /api/v1/fields/:id
  async remove(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const data = await fieldService.delete(userId, id);

      const latency = Date.now() - started;
      logger.info('fields.delete', {
        route: '/api/v1/fields/{id}',
        method: 'DELETE',
        user_id: userId,
        field_id: id,
        correlation_id: correlationId,
        latency_ms: latency,
      });

      return res.status(200).json({ success: true, data, meta: { correlation_id: correlationId, latency_ms: latency } });
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/v1/fields/:id/restore
  async restore(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const data = await fieldService.restore(userId, id);
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return next(err);
    }
  },
};