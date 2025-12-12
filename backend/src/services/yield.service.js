'use strict';

const { sequelize } = require('../config/database.config');
const ActualYield = require('../models/actualYield.model');
const Field = require('../models/field.model');
const YieldPrediction = require('../models/yield_prediction.model');
const { getRedisClient, initRedis } = require('../config/redis.config');
const { ValidationError, NotFoundError, ConflictError } = require('../errors/custom-errors');
const { emitToField, emitToUser } = require('../websocket/server');
const { getMLGatewayService } = require('./mlGateway.service');
const HealthRepository = require('../repositories/health.repository');
const { getWeatherService } = require('./weather.service');

/**
 * Yield Service
 * Business logic for actual yield data management
 */

const YIELDCACHETTLSEC = parseInt(process.env.YIELDCACHETTLSEC || '600', 10); // 10 minutes

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
 * @param {string} user_id - User ID
 * @param {string} field_id - Field ID
 * @param {object} yieldData - Yield data (actualyieldperha, totalyieldkg, harvestdate, etc.)
 * @returns {Promise<object>} Created yield entry
 */
async function create(user_id, field_id, yieldData) {
  // Validate field exists and belongs to user
  const field = await Field.findOne({
    where: { field_id, user_id, status: 'active' },
  });

  if (!field) {
    throw new NotFoundError('Field not found or does not belong to user', { field_id });
  }

  // Validate required fields
  if (!yieldData.actualyieldperha || !yieldData.totalyieldkg || !yieldData.harvestdate) {
    throw new ValidationError(
      'Missing required fields: actualyieldperha, totalyieldkg, harvestdate'
    );
  }

  // Validate harvest date is not in the future
  const harvestDate = new Date(yieldData.harvestdate);
  if (harvestDate > new Date()) {
    throw new ValidationError('Harvest date cannot be in the future');
  }

  // Check for duplicate (same field, same harvest date)
  const existing = await ActualYield.findOne({
    where: { field_id, harvestdate: yieldData.harvestdate },
  });

  if (existing) {
    throw new ConflictError('Yield entry already exists for this field on this date', {
      field_id,
      harvestdate: yieldData.harvestdate,
      existingid: existing.yieldid,
    });
  }

  // If predictionid provided, fetch prediction data
  let predictedYieldPerHa = yieldData.predictedyieldperha;
  if (yieldData.predictionid && !predictedYieldPerHa) {
    const prediction = await YieldPrediction.findByPk(yieldData.predictionid);
    if (prediction && prediction.field_id === field_id) {
      predictedYieldPerHa = prediction.predictedyieldperha;
    }
  }

  // Create yield entry
  const yieldEntry = await ActualYield.create({
    field_id,
    user_id,
    actualyieldperha: yieldData.actualyieldperha,
    totalyieldkg: yieldData.totalyieldkg,
    harvestdate: yieldData.harvestdate,
    predictionid: yieldData.predictionid || null,
    predictedyieldperha: predictedYieldPerHa || null,
    notes: yieldData.notes || null,
    cropvariety: yieldData.cropvariety || null,
    season: yieldData.season || null,
    // accuracymape will be auto-calculated by DB trigger
  });

  // Invalidate cache
  await redisDelPattern(`yields:field:${field_id}:*`);
  await redisDelPattern(`yields:user:${user_id}:*`);

  return yieldEntry.toJSON();
}

/**
 * Get yield entries for a field
 * @param {string} user_id - User ID
 * @param {string} field_id - Field ID
 * @param {object} options - Query options (page, pagesize, sort, order)
 * @returns {Promise<object>} Yield entries with pagination
 */
async function listByField(user_id, field_id, options = {}) {
  // Validate field exists and belongs to user
  const field = await Field.findOne({
    where: { field_id, user_id, status: 'active' },
  });

  if (!field) {
    throw new NotFoundError('Field not found or does not belong to user', { field_id });
  }

  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(options.pagesize, 10) || 20));
  const offset = (page - 1) * pageSize;
  const sortBy = options.sort || 'harvestdate';
  const sortOrder = (options.order || 'desc').toUpperCase();

  // Check cache
  const cacheKey = `yields:field:${field_id}:page:${page}:size:${pageSize}:sort:${sortBy}:${sortOrder}`;
  const cached = await redisGetJSON(cacheKey);
  if (cached) {
    return { ...cached, cacheHit: true };
  }

  // Query database
  const { count, rows } = await ActualYield.findAndCountAll({
    where: { field_id },
    order: [[sortBy, sortOrder]],
    limit: pageSize,
    offset,
    attributes: [
      'yieldid',
      'field_id',
      'actualyieldperha',
      'totalyieldkg',
      'harvestdate',
      'predictedyieldperha',
      'accuracymape',
      'notes',
      'cropvariety',
      'season',
      'createdat',
      'updatedat',
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
  await redisSetJSON(cacheKey, result, YIELDCACHETTLSEC);

  return { ...result, cacheHit: false };
}

/**
 * Get a single yield entry by ID
 * @param {string} user_id - User ID
 * @param {string} yieldId - Yield ID
 * @returns {Promise<object>} Yield entry
 */
async function getById(user_id, yieldId) {
  const yieldEntry = await ActualYield.findOne({
    where: { yieldid: yieldId, user_id },
    include: [
      {
        model: Field,
        as: 'field',
        attributes: ['field_id', 'name', 'area', 'areasqm'],
      },
    ],
  });

  if (!yieldEntry) {
    throw new NotFoundError('Yield entry not found', { yieldid: yieldId });
  }

  return yieldEntry.toJSON();
}

/**
 * Update a yield entry
 * @param {string} user_id - User ID
 * @param {string} yieldId - Yield ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated yield entry
 */
async function update(user_id, yieldId, updates) {
  const yieldEntry = await ActualYield.findOne({
    where: { yieldid: yieldId, user_id },
  });

  if (!yieldEntry) {
    throw new NotFoundError('Yield entry not found', { yieldid: yieldId });
  }

  // Validate harvest date if being updated
  if (updates.harvestdate) {
    const harvestDate = new Date(updates.harvestdate);
    if (harvestDate > new Date()) {
      throw new ValidationError('Harvest date cannot be in the future');
    }

    // Check for duplicate if harvest date is changing
    if (updates.harvestdate !== yieldEntry.harvestdate) {
      const existing = await ActualYield.findOne({
        where: {
          field_id: yieldEntry.field_id,
          harvestdate: updates.harvestdate,
          yieldid: { [sequelize.Op.ne]: yieldId },
        },
      });

      if (existing) {
        throw new ConflictError('Yield entry already exists for this field on this date');
      }
    }
  }

  // Update allowed fields
  const allowedUpdates = [
    'actualyieldperha',
    'totalyieldkg',
    'harvestdate',
    'predictedyieldperha',
    'notes',
    'cropvariety',
    'season',
  ];

  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      yieldEntry[key] = updates[key];
    }
  });

  await yieldEntry.save();

  // Invalidate cache
  await redisDelPattern(`yields:field:${yieldEntry.field_id}:*`);
  await redisDelPattern(`yields:user:${user_id}:*`);

  return yieldEntry.toJSON();
}

/**
 * Delete a yield entry
 * @param {string} user_id - User ID
 * @param {string} yieldId - Yield ID
 * @returns {Promise<boolean>} Success
 */
async function remove(user_id, yieldId) {
  const yieldEntry = await ActualYield.findOne({
    where: { yieldid: yieldId, user_id },
  });

  if (!yieldEntry) {
    throw new NotFoundError('Yield entry not found', { yieldid: yieldId });
  }

  const { field_id } = yieldEntry;

  await yieldEntry.destroy();

  // Invalidate cache
  await redisDelPattern(`yields:field:${field_id}:*`);
  await redisDelPattern(`yields:user:${user_id}:*`);

  return true;
}

/**
 * Get statistics for a field's yields
 * @param {string} user_id - User ID
 * @param {string} field_id - Field ID
 * @returns {Promise<object>} Statistics (avg, min, max, totalentries, etc.)
 */
async function getStatistics(user_id, field_id) {
  // Validate field exists and belongs to user
  const field = await Field.findOne({
    where: { field_id, user_id, status: 'active' },
  });

  if (!field) {
    throw new NotFoundError('Field not found or does not belong to user', { field_id });
  }

  const [result] = await sequelize.query(
    `
    SELECT
      COUNT(*)::integer AS totalentries,
      COALESCE(AVG(actualyieldperha), 0)::numeric(10,2) AS avgyieldperha,
      COALESCE(MIN(actualyieldperha), 0)::numeric(10,2) AS minyieldperha,
      COALESCE(MAX(actualyieldperha), 0)::numeric(10,2) AS maxyieldperha,
      COALESCE(AVG(accuracymape), 0)::numeric(5,2) AS avgaccuracymape,
      MIN(harvestdate) AS firstharvest,
      MAX(harvestdate) AS latestharvest
    FROM actualyields
    WHERE field_id = :field_id
    `,
    {
      replacements: { field_id },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  return (
    result || {
      totalentries: 0,
      avgyieldperha: 0,
      minyieldperha: 0,
      maxyieldperha: 0,
      avgaccuracymape: 0,
      firstharvest: null,
      latestharvest: null,
    }
  );
}

/**
 * Predict yield for a field
 * @param {string} user_id - User ID
 * @param {string} field_id - Field ID
 * @param {object} predictionOptions - Options (plantingdate, variety, soiltype, etc.)
 * @returns {Promise<object>} Prediction result
 */
async function predictYield(user_id, field_id, predictionOptions = {}) {
  // Validate field exists and belongs to user
  const field = await Field.findOne({
    where: { field_id, user_id, status: 'active' },
  });

  if (!field) {
    throw new NotFoundError('Field not found or does not belong to user', { field_id });
  }

  // 1. Get NDVI history (last 90 days)
  const healthRepository = new HealthRepository();
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);
  const startDateStr = startDate.toISOString().split('T')[0];

  const healthRecords = await healthRepository.findByFieldAndDateRange(
    field_id,
    startDateStr,
    endDate
  );

  // Calculate NDVI statistics
  const ndviValues = healthRecords.map(r => parseFloat(r.ndvimean)).filter(v => !isNaN(v));
  const ndviAvg =
    ndviValues.length > 0 ? ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length : 0.6;
  const ndviMax = ndviValues.length > 0 ? Math.max(...ndviValues) : 0.7;
  const ndviMin = ndviValues.length > 0 ? Math.min(...ndviValues) : 0.5;
  const ndviStd =
    ndviValues.length > 1
      ? Math.sqrt(
          ndviValues.reduce((sum, val) => sum + (val - ndviAvg) ** 2, 0) / ndviValues.length
        )
      : 0.1;

  // 2. Get weather data (rainfall, temperature)
  let rainfallTotal = 150; // Default mm
  let tempAvg = 28; // Default °C
  const humidity = 75; // Default %

  try {
    const weatherService = getWeatherService();
    const weatherResponse = await weatherService.getForecastByCoords(
      field.center.coordinates[1], // latitude
      field.center.coordinates[0] // longitude
    );

    if (weatherResponse.data && weatherResponse.data.totals) {
      rainfallTotal = weatherResponse.data.totals.rain_7d_mm || rainfallTotal;
    }

    if (weatherResponse.data && weatherResponse.data.days && weatherResponse.data.days.length > 0) {
      const temps = weatherResponse.data.days
        .map(d => (d.tmax + d.tmin) / 2)
        .filter(t => !isNaN(t));
      tempAvg = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : tempAvg;
    }
  } catch (error) {
    // Weather service failed - use defaults
    console.warn('Weather service unavailable, using default values:', error.message);
  }

  // 3. Build feature vector for ML model
  const areaHa = parseFloat(field.area) || 1.0;

  // Feature vector (must match trained model):
  // [ndviavg, ndvimax, ndvimin, ndvistd, rainfallmm, tempavg, humidity, areaha]
  const features = [
    {
      field_id,
      ndviavg: ndviAvg,
      ndvimax: ndviMax,
      ndvimin: ndviMin,
      ndvistd: ndviStd,
      rainfallmm: rainfallTotal,
      tempavg: tempAvg,
      humidity,
      areaha: areaHa,
    },
  ];

  // 4. Call ML service
  const mlGateway = getMLGatewayService();
  const mlResponse = await mlGateway.yieldPredict({ features }, null);

  // 5. Extract prediction
  const prediction = mlResponse.result.data.predictions[0] || {};
  const predictedYieldPerHa = parseFloat(
    prediction.predictedyield || prediction.predictedyieldperha || 4500
  );
  const confidenceLower = parseFloat(
    prediction.confidenceinterval?.lower || predictedYieldPerHa * 0.85
  );
  const confidenceUpper = parseFloat(
    prediction.confidenceinterval?.upper || predictedYieldPerHa * 1.15
  );

  // 6. Calculate derived values
  const predictedTotalYield = predictedYieldPerHa * areaHa;
  const pricePerKg = parseFloat(predictionOptions.priceperkg || 80); // LKR per kg
  const expectedRevenue = predictedTotalYield * pricePerKg;

  // Estimate harvest date (4 months from planting date or now)
  const plantingDate = predictionOptions.plantingdate
    ? new Date(predictionOptions.plantingdate)
    : new Date();
  const harvestDate = new Date(plantingDate);
  harvestDate.setMonth(harvestDate.getMonth() + 4); // Typical 4-month growing season for rice
  const harvestDateStr = harvestDate.toISOString().split('T')[0];

  // 7. Save prediction to database
  const savedPrediction = await YieldPrediction.create({
    field_id,
    predictiondate: new Date().toISOString().split('T')[0],
    predictedyieldperha: predictedYieldPerHa,
    predictedtotalyield: predictedTotalYield,
    confidencelower: confidenceLower,
    confidenceupper: confidenceUpper,
    expectedrevenue: expectedRevenue,
    harvestdateestimate: harvestDateStr,
    modelversion: mlResponse.result.data.model?.version || '1.0.0',
    featuresused: features[0],
  });

  // Invalidate cache
  await redisDelPattern(`yields:field:${field_id}:*`);
  await redisDelPattern(`yields:user:${user_id}:*`);

  // Build response
  const response = {
    predictionid: savedPrediction.predictionid,
    field_id,
    fieldname: field.name,
    fieldareaha: areaHa,
    predictiondate: savedPrediction.predictiondate,
    predictedyieldperha: parseFloat(savedPrediction.predictedyieldperha),
    predictedtotalyield: parseFloat(savedPrediction.predictedtotalyield),
    confidenceinterval: {
      lower: parseFloat(savedPrediction.confidencelower),
      upper: parseFloat(savedPrediction.confidenceupper),
    },
    expectedrevenue: parseFloat(savedPrediction.expectedrevenue),
    harvestdateestimate: savedPrediction.harvestdateestimate,
    modelversion: savedPrediction.modelversion,
    featuresused: savedPrediction.featuresused,
    mlresponse: mlResponse.cacheHit ? 'cached' : 'fresh',
  };

  // Emit real-time update to WebSocket subscribers
  try {
    emitToField(field_id, 'yieldpredictionready', {
      field_id,
      fieldName: field.name,
      predictionId: savedPrediction.predictionid,
      predictedYieldPerHa: parseFloat(savedPrediction.predictedyieldperha),
      predictedTotalYield: parseFloat(savedPrediction.predictedtotalyield),
      expectedRevenue: parseFloat(savedPrediction.expectedrevenue),
      harvestDateEstimate: savedPrediction.harvestdateestimate,
      timestamp: Date.now(),
    });

    emitToUser(user_id, 'yieldpredictionready', {
      field_id,
      fieldName: field.name,
      message: `Yield prediction ready: ${parseFloat(savedPrediction.predictedtotalyield).toFixed(0)} kg total (${parseFloat(savedPrediction.predictedyieldperha).toFixed(0)} kg/ha)`,
      expectedRevenue: parseFloat(savedPrediction.expectedrevenue),
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
 * @param {string} user_id - User ID
 * @param {string} field_id - Field ID
 * @param {object} options - Query options (limit, sort, order)
 * @returns {Promise<Array>} List of predictions
 */
async function getPredictions(user_id, field_id, options = {}) {
  // Validate field exists and belongs to user
  const field = await Field.findOne({
    where: { field_id, user_id, status: 'active' },
  });

  if (!field) {
    throw new NotFoundError('Field not found or does not belong to user', { field_id });
  }

  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 10));
  const sortBy = options.sort || 'predictiondate';
  const sortOrder = (options.order || 'desc').toUpperCase();

  // Check cache
  const cacheKey = `yields:predictions:field:${field_id}:limit:${limit}:sort:${sortBy}:${sortOrder}`;
  const cached = await redisGetJSON(cacheKey);
  if (cached) {
    return { predictions: cached, cacheHit: true };
  }

  // Query database
  const predictions = await YieldPrediction.findAll({
    where: { field_id },
    order: [[sortBy, sortOrder]],
    limit,
    attributes: [
      'predictionid',
      'field_id',
      'predictiondate',
      'predictedyieldperha',
      'predictedtotalyield',
      'confidencelower',
      'confidenceupper',
      'expectedrevenue',
      'harvestdateestimate',
      'modelversion',
      'actualyield',
      'accuracymape',
      'createdat',
    ],
  });

  const result = predictions.map(p => ({
    predictionid: p.predictionid,
    field_id: p.field_id,
    predictiondate: p.predictiondate,
    predictedyieldperha: parseFloat(p.predictedyieldperha),
    predictedtotalyield: parseFloat(p.predictedtotalyield),
    confidenceinterval: {
      lower: parseFloat(p.confidencelower),
      upper: parseFloat(p.confidenceupper),
    },
    expectedrevenue: parseFloat(p.expectedrevenue),
    harvestdateestimate: p.harvestdateestimate,
    modelversion: p.modelversion,
    actualyield: p.actualyield ? parseFloat(p.actualyield) : null,
    accuracymape: p.accuracymape ? parseFloat(p.accuracymape) : null,
    createdat: p.createdat,
  }));

  // Cache result
  await redisSetJSON(cacheKey, result, YIELDCACHETTLSEC);

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
