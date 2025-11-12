'use strict';

const { getMLGatewayService } = require('../../services/mlGateway.service');
const { logger } = require('../../utils/logger');

const mlGateway = getMLGatewayService();

/**
 * ML Controller
 * - POST /api/v1/ml/segmentation/predict
 *   Accepts validated body (via validation.middleware schemas.mlPredict)
 *   Performs cache lookup via service; proxies to ML service on miss
 */
module.exports = {
  async predict(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;
    try {
      const input = req.body || {};
      const {
        result,
        cacheHit,
        downstreamStatus,
        modelVersion,
        latency_ms,
      } = await mlGateway.predict(input, correlationId);

      const totalLatency = Date.now() - started;
      logger.info('ml.predict', {
        route: '/api/v1/ml/segmentation/predict',
        method: 'POST',
        correlation_id: correlationId,
        latency_ms: totalLatency,
        cache_hit: cacheHit,
        downstream_status: downstreamStatus,
        model_version: modelVersion || null,
      });

      return res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          correlation_id: correlationId,
          latency_ms: totalLatency,
          cache_hit: cacheHit,
        },
      });
    } catch (err) {
      return next(err);
    }
  },
};