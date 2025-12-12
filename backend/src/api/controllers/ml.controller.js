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
  async yieldPredict(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;
    try {
      const input = req.body || {};
      const { result, cacheHit, downstreamStatus, modelVersion, latencyms } =
        await mlGateway.yieldPredict(input, correlationId);

      const totalLatency = Date.now() - started;
      logger.info('ml.yieldPredict', {
        route: '/api/v1/ml/yield/predict',
        method: 'POST',
        correlationid: correlationId,
        latencyms: totalLatency,
        cachehit: cacheHit,
        downstreamstatus: downstreamStatus,
        modelversion: modelVersion || null,
      });

      return res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          correlationid: correlationId,
          latencyms: totalLatency,
          cachehit: cacheHit,
        },
      });
    } catch (err) {
      return next(err);
    }
  },

  async predict(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;
    try {
      const input = req.body || {};
      const { result, cacheHit, downstreamStatus, modelVersion, latencyms } =
        await mlGateway.predict(input, correlationId);

      const totalLatency = Date.now() - started;
      logger.info('ml.predict', {
        route: '/api/v1/ml/segmentation/predict',
        method: 'POST',
        correlationid: correlationId,
        latencyms: totalLatency,
        cachehit: cacheHit,
        downstreamstatus: downstreamStatus,
        modelversion: modelVersion || null,
      });

      return res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          correlationid: correlationId,
          latencyms: totalLatency,
          cachehit: cacheHit,
        },
      });
    } catch (err) {
      return next(err);
    }
  },
};
