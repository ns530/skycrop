'use strict';

const { getHealthService } = require('../../services/health.service');
const { logger } = require('../../utils/logger');

const healthService = getHealthService();

function getCorrelationId(req) {
  return req.headers['x-correlation-id'] || req.headers['x-request-id'] || null;
}

/**
 * Health Controller (Sprint 3)
 * - GET /api/v1/fields/:id/health?from=&to=&page=&pageSize=
 * - POST /api/v1/fields/:id/health/compute
 * - Existing (Sprint 2) endpoints remain: history and refresh
 */
module.exports = {
  // GET /api/v1/fields/:id/health?from=YYYY-MM-DD&to=YYYY-MM-DD&page=&pageSize=
  // Returns paginated health_snapshots. If no filters provided, still paginated (defaults page=1,pageSize=20).
  async listForField(req, res, next) {
    const started = Date.now();
    const corr = getCorrelationId(req);
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { from, to, page, pageSize } = req.query || {};

      const result = await healthService.listSnapshots(userId, id, {
        from,
        to,
        page: page ? parseInt(page, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      });

      const latency = Date.now() - started;
      logger.info('health.snapshots.list', {
        route: req.originalUrl,
        correlation_id: corr,
        latency_ms: latency,
        field_id: id,
        from,
        to,
        page: result.page,
        page_size: result.pageSize,
        total: result.total,
      });

      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: { page: result.page, pageSize: result.pageSize, total: result.total },
        meta: { correlation_id: corr, latency_ms: latency },
      });
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/v1/fields/:id/health/compute { date, recompute? }
  // Idempotent: if snapshot exists and recompute=false, return existing (200). Else compute & upsert (201 for first create, 200 for recompute).
  async computeForField(req, res, next) {
    const started = Date.now();
    const corr = getCorrelationId(req);
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { date, recompute = false } = req.body || {};

      // If snapshot exists and no recompute -> return existing
      if (!recompute) {
        const existing = await healthService.findSnapshot(id, date);
        if (existing) {
          const latency = Date.now() - started;
          logger.info('health.snapshots.compute.idempotent', {
            route: req.originalUrl,
            correlation_id: corr,
            latency_ms: latency,
            cache_hit: true,
            field_id: id,
            date,
          });
          return res
            .status(200)
            .json({ success: true, data: existing, meta: { correlation_id: corr, latency_ms: latency, cache_hit: true } });
        }
      }

      // Compute indices via Sentinel + cache
      const computed = await healthService.computeIndicesForField(userId, id, date);

      // Persist snapshot (idempotent upsert)
      const saved = await healthService.upsertSnapshot(
        id,
        computed.timestamp,
        { ndvi: computed.ndvi, ndwi: computed.ndwi, tdvi: computed.tdvi, source: computed.source || 'sentinel2' },
        !!recompute
      );

      const latency = Date.now() - started;
      logger.info('health.snapshots.compute', {
        route: req.originalUrl,
        correlation_id: corr,
        latency_ms: latency,
        cache_hit: !!computed.cache_hit,
        field_id: id,
        date,
      });

      const status = recompute ? 200 : 201;
      return res
        .status(status)
        .json({ success: true, data: saved, meta: { correlation_id: corr, latency_ms: latency, cache_hit: !!computed.cache_hit } });
    } catch (err) {
      return next(err);
    }
  },

  // GET /api/v1/fields/:id/health/history?days=180 or &from=YYYY-MM-DD&to=YYYY-MM-DD
  async getHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { days, from, to } = req.query || {};
      const data = await healthService.getHistory(userId, id, { days, from, to });
      return res.status(200).json({ success: true, data });
    } catch (err) {
      return next(err);
    }
  },

  // POST /api/v1/fields/:id/health/refresh
  async refresh(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const data = await healthService.refresh(userId, id);
      return res.status(202).json({ success: true, data });
    } catch (err) {
      return next(err);
    }
  },
};