'use strict';

const { getSatelliteService } = require('../../services/satellite.service');
const { logger } = require('../../utils/logger');

const satelliteService = getSatelliteService();

function correlationId(req) {
  return req.headers['x-correlation-id'] || req.headers['x-request-id'] || null;
}

module.exports = {
  /**
   * GET /api/v1/satellite/tiles/:z/:x/:y?bands=...&date=YYYY-MM-DD&cloudlt=20
   * - Auth-protected
   * - Validation handled in routes via validation.middleware
   * - Supports ETag via If-None-Match
   */
  async getTile(req, res, next) {
    const start = Date.now();
    try {
      const { z, x, y } = req.params;
      const { date, bands = 'RGB', cloudlt = 20 } = req.query;
      const ifNoneMatch = req.headers['if-none-match'] || null;

      const result = await satelliteService.getTile({
        z: Number(z),
        x: Number(x),
        y: Number(y),
        date,
        bands,
        cloudlt: Number(cloudlt),
        ifNoneMatch,
      });

      // Headers common
      const headers = {
        'Cache-Control': result.headers['Cache-Control'],
        ETag: result.headers.ETag,
        'Content-Type': result.headers['Content-Type'],
      };

      const latencyms = Date.now() - start;
      logger.info('satellite.tiles', {
        correlationid: correlationId(req),
        route: req.originalUrl,
        method: 'GET',
        status: result.status,
        latencyms,
        cachehit: result.meta?.cachehit || false,
        etag: headers.ETag,
      });

      if (result.status === 304) {
        return res.status(304).set(headers).send();
      }

      return res.status(200).set(headers).send(result.body);
    } catch (err) {
      return next(err);
    }
  },

  /**
   * POST /api/v1/satellite/preprocess
   * Body: { bbox:[minLon,minLat,maxLon,maxLat], date, bands[], cloudmask?:boolean, idempotencyKey?:string }
   * Returns: { jobid, status: 'queued'|'completed'|'failed' }
   */
  async preprocess(req, res, next) {
    const start = Date.now();
    try {
      const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey || null;
      const { bbox, date, bands = ['RGB'], cloudmask = false } = req.body;

      const out = await satelliteService.queuePreprocess(
        { bbox, date, bands, cloudmask },
        idempotencyKey
      );

      const latencyms = Date.now() - start;
      logger.info('satellite.preprocess', {
        correlationid: correlationId(req),
        route: req.originalUrl,
        method: 'POST',
        status: 202,
        latencyms,
        jobid: out.jobid,
      });

      // 202 Accepted indicates async processing
      return res.status(202).json({
        success: true,
        data: { jobid: out.jobid, status: out.status },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * Optional (if wired): GET /api/v1/satellite/preprocess/:jobid
   * Returns minimal job status for polling.
   */
  async getPreprocessStatus(req, res, next) {
    try {
      const { jobid } = req.params;
      const j = satelliteService.getJob(jobid);
      if (!j) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOTFOUND', message: 'Job not found' },
          meta: { timestamp: new Date().toISOString() },
        });
      }
      return res.status(200).json({
        success: true,
        data: j,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (err) {
      return next(err);
    }
  },
};
