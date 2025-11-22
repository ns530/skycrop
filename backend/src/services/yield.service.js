'use strict';

const { sequelize } = require('../config/database.config');
const ActualYield = require('../models/actualYield.model');
const Field = require('../models/field.model');
const YieldPrediction = require('../models/yield_prediction.model');
const { getRedisClient, initRedis } = require('../config/redis.config');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
} = require('../errors/custom-errors');
const { emitToField, emitToUser } = require('../websocket/server');

/**
 * Yield Service
 * Business logic for actual yield data management
 */

const YIELD_CACHE_TTL_SEC = parseInt(process.env.YIELD_CACHE_TTL_SEC || '600', 10); // 10 minutes

/**
 * Redis helpers
 */
async function getRedis() {
  const client = getRedisClient();
  if (!client.isOpen) {
    await initRedis();
  }
  return client;
}

async function redisGetJSON(key) {
  try {
    const redis = await getRedis();
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function redisSetJSON(key, value, ttlSec) {
  try {
    const redis = await getRedis();
    const payload = JSON.stringify(value);
    if (typeof redis.setEx === 'function') {
      await redis.setEx(key, ttlSec, payload);
    } else {
      await redis.setex(key, ttlSec, payload);
    }
  } catch (err) {
    // Cache failure should not break the request
    console.warn('Redis setJSON failed:', err.message);
  }
}

async function redisDelPattern(pattern) {
  try {
    const redis = await getRedis();
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = next;
      if (keys && keys.length) {
        await redis.del(keys);
      }
    } while (cursor !== '0');
  } catch (err) {
    console.warn('Redis delPattern failed:', err.message);
  }
}

/**
 * Create a new actual yield entry
 * @param {string} userId - User ID
 * @param {string} fieldId - Field ID
 * @param {object} yieldData - Yield data (actual_yield_per_ha, total_yield_kg, harvest_date, etc.)
 * @returns {Promise<object>} Created yield entry
 */
async function create(userId, fieldId, yieldData) {
  // Validate field exists and belongs to user
  const field = await Field.findOne({
    where: { field_id: fieldId, user_id: userId, status: 'active' },
  });

  if (!field) {
    throw new NotFoundError('Field not found or does not belong to user', { field_id: fieldId });
  }

  // Validate required fields
  if (!yieldData.actual_yield_per_ha || !yieldData.total_yield_kg || !yieldData.harvest_date) {
    throw new ValidationError('Missing required fields: actual_yield_per_ha, total_yield_kg, harvest_date');
  }

  // Validate harvest date is not in the future
  const harvestDate = new Date(yieldData.harvest_date);
  if (harvestDate > new Date()) {
    throw new ValidationError('Harvest date cannot be in the future');
  }

  // Check for duplicate (same field, same harvest date)
  const existing = await ActualYield.findOne({
    where: { field_id: fieldId, harvest_date: yieldData.harvest_date },
  });

  if (existing) {
    throw new ConflictError('Yield entry already exists for this field on this date', {
      field_id: fieldId,
      harvest_date: yieldData.harvest_date,
      existing_id: existing.yield_id,
    });
  }

  // If prediction_id provided, fetch prediction data
  let predictedYieldPerHa = yieldData.predicted_yield_per_ha;
  if (yieldData.prediction_id && !predictedYieldPerHa) {
    const prediction = await YieldPrediction.findByPk(yieldData.prediction_id);
    if (prediction && prediction.field_id === fieldId) {
      predictedYieldPerHa = prediction.predicted_yield_per_ha;
    }
  }

  // Create yield entry
  const yieldEntry = await ActualYield.create({
    field_id: fieldId,
    user_id: userId,
    actual_yield_per_ha: yieldData.actual_yield_per_ha,
    total_yield_kg: yieldData.total_yield_kg,
    harvest_date: yieldData.harvest_date,
    prediction_id: yieldData.prediction_id || null,
    predicted_yield_per_ha: predictedYieldPerHa || null,
    notes: yieldData.notes || null,
    crop_variety: yieldData.crop_variety || null,
    season: yieldData.season || null,
    // accuracy_mape will be auto-calculated by DB trigger
  });

  // Invalidate cache
  await redisDelPattern(`yields:field:${fieldId}:*`);
  await redisDelPattern(`yields:user:${userId}:*`);

  return yieldEntry.toJSON();
}

/**
 * Get yield entries for a field
 * @param {string} userId - User ID
 * @param {string} fieldId - Field ID
 * @param {object} options - Query options (page, page_size, sort, order)
 * @returns {Promise<object>} Yield entries with pagination
 */
async function listByField(userId, fieldId, options = {}) {
  // Validate field exists and belongs to user
  const field = await Field.findOne({
    where: { field_id: fieldId, user_id: userId, status: 'active' },
  });

  if (!field) {
    throw new NotFoundError('Field not found or does not belong to user', { field_id: fieldId });
  }

  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(options.page_size, 10) || 20));
  const offset = (page - 1) * pageSize;
  const sortBy = options.sort || 'harvest_date';
  const sortOrder = (options.order || 'desc').toUpperCase();

  // Check cache
  const cacheKey = `yields:field:${fieldId}:page:${page}:size:${pageSize}:sort:${sortBy}:${sortOrder}`;
  const cached = await redisGetJSON(cacheKey);
  if (cached) {
    return { ...cached, cacheHit: true };
  }

  // Query database
  const { count, rows } = await ActualYield.findAndCountAll({
    where: { field_id: fieldId },
    order: [[sortBy, sortOrder]],
    limit: pageSize,
    offset,
    attributes: [
      'yield_id',
      'field_id',
      'actual_yield_per_ha',
      'total_yield_kg',
      'harvest_date',
      'predicted_yield_per_ha',
      'accuracy_mape',
      'notes',
      'crop_variety',
      'season',
      'created_at',
      'updated_at',
    ],
  });

  const result = {
    items: rows.map(r => r.toJSON()),
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
  };

  // Cache result
  await redisSetJSON(cacheKey, result, YIELD_CACHE_TTL_SEC);

  return { ...result, cacheHit: false };
}

/**
 * Get a single yield entry by ID
 * @param {string} userId - User ID
 * @param {string} yieldId - Yield ID
 * @returns {Promise<object>} Yield entry
 */
async function getById(userId, yieldId) {
  const yieldEntry = await ActualYield.findOne({
    where: { yield_id: yieldId, user_id: userId },
    include: [
      {
        model: Field,
        as: 'field',
        attributes: ['field_id', 'name', 'area', 'area_sqm'],
      },
    ],
  });

  if (!yieldEntry) {
    throw new NotFoundError('Yield entry not found', { yield_id: yieldId });
  }

  return yieldEntry.toJSON();
}

/**
 * Update a yield entry
 * @param {string} userId - User ID
 * @param {string} yieldId - Yield ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated yield entry
 */
async function update(userId, yieldId, updates) {
  const yieldEntry = await ActualYield.findOne({
    where: { yield_id: yieldId, user_id: userId },
  });

  if (!yieldEntry) {
    throw new NotFoundError('Yield entry not found', { yield_id: yieldId });
  }

  // Validate harvest date if being updated
  if (updates.harvest_date) {
    const harvestDate = new Date(updates.harvest_date);
    if (harvestDate > new Date()) {
      throw new ValidationError('Harvest date cannot be in the future');
    }

    // Check for duplicate if harvest date is changing
    if (updates.harvest_date !== yieldEntry.harvest_date) {
      const existing = await ActualYield.findOne({
        where: {
          field_id: yieldEntry.field_id,
          harvest_date: updates.harvest_date,
          yield_id: { [sequelize.Op.ne]: yieldId },
        },
      });

      if (existing) {
        throw new ConflictError('Yield entry already exists for this field on this date');
      }
    }
  }

  // Update allowed fields
  const allowedUpdates = [
    'actual_yield_per_ha',
    'total_yield_kg',
    'harvest_date',
    'predicted_yield_per_ha',
    'notes',
    'crop_variety',
    'season',
  ];

  for (const key of Object.keys(updates)) {
    if (allowedUpdates.includes(key)) {
      yieldEntry[key] = updates[key];
    }
  }

  await yieldEntry.save();

  // Invalidate cache
  await redisDelPattern(`yields:field:${yieldEntry.field_id}:*`);
  await redisDelPattern(`yields:user:${userId}:*`);

  return yieldEntry.toJSON();
}

/**
 * Delete a yield entry
 * @param {string} userId - User ID
 * @param {string} yieldId - Yield ID
 * @returns {Promise<boolean>} Success
 */
async function remove(userId, yieldId) {
  const yieldEntry = await ActualYield.findOne({
    where: { yield_id: yieldId, user_id: userId },
  });

  if (!yieldEntry) {
    throw new NotFoundError('Yield entry not found', { yield_id: yieldId });
  }

  const fieldId = yieldEntry.field_id;

  await yieldEntry.destroy();

  // Invalidate cache
  await redisDelPattern(`yields:field:${fieldId}:*`);
  await redisDelPattern(`yields:user:${userId}:*`);

  return true;
}

/**
 * Get statistics for a field's yields
 * @param {string} userId - User ID
 * @param {string} fieldId - Field ID
 * @returns {Promise<object>} Statistics (avg, min, max, total_entries, etc.)
 */
async function getStatistics(userId, fieldId) {
  // Validate field exists and belongs to user
  const field = await Field.findOne({
    where: { field_id: fieldId, user_id: userId, status: 'active' },
  });

  if (!field) {
    throw new NotFoundError('Field not found or does not belong to user', { field_id: fieldId });
  }

  const [result] = await sequelize.query(
    `
    SELECT
      COUNT(*)::integer AS total_entries,
      COALESCE(AVG(actual_yield_per_ha), 0)::numeric(10,2) AS avg_yield_per_ha,
      COALESCE(MIN(actual_yield_per_ha), 0)::numeric(10,2) AS min_yield_per_ha,
      COALESCE(MAX(actual_yield_per_ha), 0)::numeric(10,2) AS max_yield_per_ha,
      COALESCE(AVG(accuracy_mape), 0)::numeric(5,2) AS avg_accuracy_mape,
      MIN(harvest_date) AS first_harvest,
      MAX(harvest_date) AS latest_harvest
    FROM actual_yields
    WHERE field_id = :field_id
    `,
    {
      replacements: { field_id: fieldId },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  return result || {
    total_entries: 0,
    avg_yield_per_ha: 0,
    min_yield_per_ha: 0,
    max_yield_per_ha: 0,
    avg_accuracy_mape: 0,
    first_harvest: null,
    latest_harvest: null,
  };
}

/**
 * Predict yield for a field
 * @param {string} userId - User ID
 * @param {string} fieldId - Field ID
 * @param {object} predictionOptions - Options (planting_date, variety, soil_type, etc.)
 * @returns {Promise<object>} Prediction result
 */
async function predictYield(userId, fieldId, predictionOptions = {}) {
  const { getMLGatewayService } = require('./mlGateway.service');
  const HealthRepository = require('../repositories/health.repository');
  const { getWeatherService } = require('./weather.service');

  // Validate field exists and belongs to user
  const field = await Field.findOne({
    where: { field_id: fieldId, user_id: userId, status: 'active' },
  });

  if (!field) {
    throw new NotFoundError('Field not found or does not belong to user', { field_id: fieldId });
  }

  // 1. Get NDVI history (last 90 days)
  const healthRepository = new HealthRepository();
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);
  const startDateStr = startDate.toISOString().split('T')[0];

  const healthRecords = await healthRepository.findByFieldAndDateRange(fieldId, startDateStr, endDate);

  // Calculate NDVI statistics
  const ndviValues = healthRecords.map(r => parseFloat(r.ndvi_mean)).filter(v => !isNaN(v));
  const ndviAvg = ndviValues.length > 0 ? ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length : 0.6;
  const ndviMax = ndviValues.length > 0 ? Math.max(...ndviValues) : 0.7;
  const ndviMin = ndviValues.length > 0 ? Math.min(...ndviValues) : 0.5;
  const ndviStd = ndviValues.length > 1 ? Math.sqrt(ndviValues.reduce((sum, val) => sum + Math.pow(val - ndviAvg, 2), 0) / ndviValues.length) : 0.1;

  // 2. Get weather data (rainfall, temperature)
  let rainfallTotal = 150; // Default mm
  let tempAvg = 28; // Default °C
  let humidity = 75; // Default %

  try {
    const weatherService = getWeatherService();
    const weatherResponse = await weatherService.getForecastByCoords(
      field.center.coordinates[1], // latitude
      field.center.coordinates[0]  // longitude
    );

    if (weatherResponse.data && weatherResponse.data.totals) {
      rainfallTotal = weatherResponse.data.totals.rain_7d_mm || rainfallTotal;
    }

    if (weatherResponse.data && weatherResponse.data.days && weatherResponse.data.days.length > 0) {
      const temps = weatherResponse.data.days.map(d => (d.tmax + d.tmin) / 2).filter(t => !isNaN(t));
      tempAvg = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : tempAvg;
    }
  } catch (error) {
    // Weather service failed - use defaults
    console.warn('Weather service unavailable, using default values:', error.message);
  }

  // 3. Build feature vector for ML model
  const areaHa = parseFloat(field.area) || 1.0;
  
  // Feature vector (must match trained model):
  // [ndvi_avg, ndvi_max, ndvi_min, ndvi_std, rainfall_mm, temp_avg, humidity, area_ha]
  const features = [{
    field_id: fieldId,
    ndvi_avg: ndviAvg,
    ndvi_max: ndviMax,
    ndvi_min: ndviMin,
    ndvi_std: ndviStd,
    rainfall_mm: rainfallTotal,
    temp_avg: tempAvg,
    humidity: humidity,
    area_ha: areaHa,
  }];

  // 4. Call ML service
  const mlGateway = getMLGatewayService();
  const mlResponse = await mlGateway.yieldPredict({ features }, null);

  // 5. Extract prediction
  const prediction = mlResponse.result.data.predictions[0] || {};
  const predictedYieldPerHa = parseFloat(prediction.predicted_yield || prediction.predicted_yield_per_ha || 4500);
  const confidenceLower = parseFloat(prediction.confidence_interval?.lower || predictedYieldPerHa * 0.85);
  const confidenceUpper = parseFloat(prediction.confidence_interval?.upper || predictedYieldPerHa * 1.15);

  // 6. Calculate derived values
  const predictedTotalYield = predictedYieldPerHa * areaHa;
  const pricePerKg = parseFloat(predictionOptions.price_per_kg || 80); // LKR per kg
  const expectedRevenue = predictedTotalYield * pricePerKg;

  // Estimate harvest date (4 months from planting date or now)
  const plantingDate = predictionOptions.planting_date ? new Date(predictionOptions.planting_date) : new Date();
  const harvestDate = new Date(plantingDate);
  harvestDate.setMonth(harvestDate.getMonth() + 4); // Typical 4-month growing season for rice
  const harvestDateStr = harvestDate.toISOString().split('T')[0];

  // 7. Save prediction to database
  const savedPrediction = await YieldPrediction.create({
    field_id: fieldId,
    prediction_date: new Date().toISOString().split('T')[0],
    predicted_yield_per_ha: predictedYieldPerHa,
    predicted_total_yield: predictedTotalYield,
    confidence_lower: confidenceLower,
    confidence_upper: confidenceUpper,
    expected_revenue: expectedRevenue,
    harvest_date_estimate: harvestDateStr,
    model_version: mlResponse.result.data.model?.version || '1.0.0',
    features_used: features[0],
  });

  // Invalidate cache
  await redisDelPattern(`yields:field:${fieldId}:*`);
  await redisDelPattern(`yields:user:${userId}:*`);

  // Build response
  const response = {
    prediction_id: savedPrediction.prediction_id,
    field_id: fieldId,
    field_name: field.name,
    field_area_ha: areaHa,
    prediction_date: savedPrediction.prediction_date,
    predicted_yield_per_ha: parseFloat(savedPrediction.predicted_yield_per_ha),
    predicted_total_yield: parseFloat(savedPrediction.predicted_total_yield),
    confidence_interval: {
      lower: parseFloat(savedPrediction.confidence_lower),
      upper: parseFloat(savedPrediction.confidence_upper),
    },
    expected_revenue: parseFloat(savedPrediction.expected_revenue),
    harvest_date_estimate: savedPrediction.harvest_date_estimate,
    model_version: savedPrediction.model_version,
    features_used: savedPrediction.features_used,
    ml_response: mlResponse.cacheHit ? 'cached' : 'fresh',
  };

  // Emit real-time update to WebSocket subscribers
  try {
    emitToField(fieldId, 'yield_prediction_ready', {
      fieldId,
      fieldName: field.name,
      predictionId: savedPrediction.prediction_id,
      predictedYieldPerHa: parseFloat(savedPrediction.predicted_yield_per_ha),
      predictedTotalYield: parseFloat(savedPrediction.predicted_total_yield),
      expectedRevenue: parseFloat(savedPrediction.expected_revenue),
      harvestDateEstimate: savedPrediction.harvest_date_estimate,
      timestamp: Date.now(),
    });

    emitToUser(userId, 'yield_prediction_ready', {
      fieldId,
      fieldName: field.name,
      message: `Yield prediction ready: ${parseFloat(savedPrediction.predicted_total_yield).toFixed(0)} kg total (${parseFloat(savedPrediction.predicted_yield_per_ha).toFixed(0)} kg/ha)`,
      expectedRevenue: parseFloat(savedPrediction.expected_revenue),
      timestamp: Date.now(),
    });
  } catch (error) {
    // Don't fail the request if WebSocket emit fails
    console.error('Failed to emit yield prediction update:', error.message);
  }

  return response;
}

/**
 * Get predictions for a field
 * @param {string} userId - User ID
 * @param {string} fieldId - Field ID
 * @param {object} options - Query options (limit, sort, order)
 * @returns {Promise<Array>} List of predictions
 */
async function getPredictions(userId, fieldId, options = {}) {
  // Validate field exists and belongs to user
  const field = await Field.findOne({
    where: { field_id: fieldId, user_id: userId, status: 'active' },
  });

  if (!field) {
    throw new NotFoundError('Field not found or does not belong to user', { field_id: fieldId });
  }

  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 10));
  const sortBy = options.sort || 'prediction_date';
  const sortOrder = (options.order || 'desc').toUpperCase();

  // Check cache
  const cacheKey = `yields:predictions:field:${fieldId}:limit:${limit}:sort:${sortBy}:${sortOrder}`;
  const cached = await redisGetJSON(cacheKey);
  if (cached) {
    return { predictions: cached, cacheHit: true };
  }

  // Query database
  const predictions = await YieldPrediction.findAll({
    where: { field_id: fieldId },
    order: [[sortBy, sortOrder]],
    limit,
    attributes: [
      'prediction_id',
      'field_id',
      'prediction_date',
      'predicted_yield_per_ha',
      'predicted_total_yield',
      'confidence_lower',
      'confidence_upper',
      'expected_revenue',
      'harvest_date_estimate',
      'model_version',
      'actual_yield',
      'accuracy_mape',
      'created_at',
    ],
  });

  const result = predictions.map(p => ({
    prediction_id: p.prediction_id,
    field_id: p.field_id,
    prediction_date: p.prediction_date,
    predicted_yield_per_ha: parseFloat(p.predicted_yield_per_ha),
    predicted_total_yield: parseFloat(p.predicted_total_yield),
    confidence_interval: {
      lower: parseFloat(p.confidence_lower),
      upper: parseFloat(p.confidence_upper),
    },
    expected_revenue: parseFloat(p.expected_revenue),
    harvest_date_estimate: p.harvest_date_estimate,
    model_version: p.model_version,
    actual_yield: p.actual_yield ? parseFloat(p.actual_yield) : null,
    accuracy_mape: p.accuracy_mape ? parseFloat(p.accuracy_mape) : null,
    created_at: p.created_at,
  }));

  // Cache result
  await redisSetJSON(cacheKey, result, YIELD_CACHE_TTL_SEC);

  return { predictions: result, cacheHit: false };
}

/**
 * Factory function to get service instance
 */
function getYieldService() {
  return {
    create,
    listByField,
    getById,
    update,
    remove,
    getStatistics,
    predictYield,
    getPredictions,
  };
}

module.exports = { getYieldService };

