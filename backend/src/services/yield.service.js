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
  };
}

module.exports = { getYieldService };

