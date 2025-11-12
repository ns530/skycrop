'use strict';

const crypto = require('crypto');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database.config');
const { getRedisClient, initRedis } = require('../config/redis.config');
const { logger } = require('../utils/logger');
const { ValidationError } = require('../errors/custom-errors');
const { getHealthService } = require('./health.service');
const { getWeatherService } = require('./weather.service');

// Env-configurable thresholds and TTLs (with defaults)
const WATER_NDWI_THRESHOLD = parseFloat(process.env.WATER_NDWI_THRESHOLD || '0.1');
const WATER_RAIN_MM_MIN = parseFloat(process.env.WATER_RAIN_MM_MIN || '5'); // 3-day min mm to avoid water alert
const NDVI_GROWTH_MIN = parseFloat(process.env.NDVI_GROWTH_MIN || '0.02'); // 14-day delta threshold
const TDVI_STRESS_THRESHOLD = parseFloat(process.env.TDVI_STRESS_THRESHOLD || '0.5');

const RECO_TTL_COMPUTE_SECONDS = parseInt(process.env.RECO_TTL_COMPUTE_SECONDS || '86400', 10); // 24h
const RECO_TTL_LIST_SECONDS = parseInt(process.env.RECO_TTL_LIST_SECONDS || '300', 10); // 5m

/**
 * Lazy Redis accessors (shared)
 */
async function getRedis() {
  const client = getRedisClient();
  if (!client.isOpen) {
    await initRedis();
  }
  return client;
}

async function cacheGetJSON(key) {
  const redis = await getRedis();
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function cacheSetJSON(key, value, ttlSec) {
  const redis = await getRedis();
  const payload = JSON.stringify(value);
  if (typeof redis.setEx === 'function') {
    await redis.setEx(key, ttlSec, payload);
  } else {
    // fallback older API
    await redis.setex(key, ttlSec, payload);
  }
}

function stableHash(obj) {
  const s = JSON.stringify(obj, Object.keys(obj).sort());
  return crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);
}

function toISODate(dateStr) {
  // Expects YYYY-MM-DD; returns ISO 00:00:00Z
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr || ''))) {
    throw new ValidationError('date must be YYYY-MM-DD', { field: 'date' });
  }
  return `${dateStr}T00:00:00.000Z`;
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

class RecommendationService {
  constructor() {
    this.healthService = getHealthService();
    this.weatherService = getWeatherService();
  }

  computeCacheKey(fieldId, date) {
    return `recommendations:compute:${fieldId}:${date}`;
  }

  listCacheKey(fieldId, filters) {
    return `recommendations:list:${fieldId}:${stableHash(filters || {})}`;
  }

  /**
   * Compute water/fertilizer recommendations for field/date without persisting.
   * Caches the computed array for 24h (configurable).
   *
   * Inputs:
   *  - userId: string (required to authorize underlying services)
   *  - fieldId: string
   *  - date: YYYY-MM-DD
   *  - options: { recompute?: boolean }
   *
   * Output: { recommendations: Array<Reco>, meta: { cache_hit, rules_fired } }
   */
  async computeRecommendationsForField(userId, fieldId, date, options = {}) {
    const { recompute = false } = options;
    if (!fieldId) throw new ValidationError('fieldId is required');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) {
      throw new ValidationError('date must be YYYY-MM-DD', { field: 'date' });
    }

    const computeKey = this.computeCacheKey(fieldId, date);
    if (!recompute) {
      const cached = await cacheGetJSON(computeKey);
      if (cached && Array.isArray(cached.recommendations)) {
        return { recommendations: cached.recommendations, meta: { cache_hit: true } };
      }
    }

    // 1) Fetch recent health window (last 30 days up to date)
    const from = addDays(date, -30);
    const to = date;
    const tStart = Date.now();
    const health = await this.healthService.listSnapshots(userId, fieldId, {
      from,
      to,
      page: 1,
      pageSize: 1000,
    });
    const items = Array.isArray(health.items) ? health.items.slice() : [];
    // Ensure DESC by timestamp (service already orders desc)
    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const dateEnd = new Date(`${date}T23:59:59.999Z`).getTime();
    const latest = items.find((s) => new Date(s.timestamp).getTime() <= dateEnd) || null;

    // Snapshot approximately 14 days ago (closest at or before date-14)
    const date14 = addDays(date, -14);
    const date14End = new Date(`${date14}T23:59:59.999Z`).getTime();
    const fourteenAgo = items.find((s) => new Date(s.timestamp).getTime() <= date14End) || null;

    const ndviLatest = typeof latest?.ndvi === 'number' ? Number(latest.ndvi) : null;
    const ndwiLatest = typeof latest?.ndwi === 'number' ? Number(latest.ndwi) : null;
    const tdviLatest = typeof latest?.tdvi === 'number' ? Number(latest.tdvi) : null;

    const ndvi14 = typeof fourteenAgo?.ndvi === 'number' ? Number(fourteenAgo.ndvi) : null;
    const deltaNDVI = ndviLatest != null && ndvi14 != null ? ndviLatest - ndvi14 : null;

    // 2) Fetch 7-day forecast (normalized)
    const fc = await this.weatherService.getForecast(userId, fieldId);
    const rain3 = Number(fc?.data?.totals?.rain_3d_mm ?? 0);
    const rain7 = Number(fc?.data?.totals?.rain_7d_mm ?? 0);

    const rulesFired = [];
    const recs = [];

    // 3) Water alert heuristic
    // Trigger 1: NDWI < WATER_NDWI_THRESHOLD AND 3-day rain < WATER_RAIN_MM_MIN
    // Severity:
    //   - high: NDWI < 0.05 OR 7-day forecast < 10 mm
    //   - medium: NDWI in [0.05, 0.1) AND 3-day forecast < 5 mm
    //   - low: NDWI in [0.1, 0.15) AND 3-day forecast < 2 mm (special case even if base trigger fails)
    if (ndwiLatest != null) {
      let waterSeverity = null;
      let waterReason = null;
      const baseTrigger = ndwiLatest < WATER_NDWI_THRESHOLD && rain3 < WATER_RAIN_MM_MIN;
      const lowOnlyTrigger = ndwiLatest >= 0.10 && ndwiLatest < 0.15 && rain3 < 2;

      if (baseTrigger) {
        if (ndwiLatest < 0.05 || rain7 < 10) {
          waterSeverity = 'high';
          rulesFired.push('water.high.ndwi_or_rain7');
        } else if (ndwiLatest >= 0.05 && ndwiLatest < WATER_NDWI_THRESHOLD && rain3 < WATER_RAIN_MM_MIN) {
          waterSeverity = 'medium';
          rulesFired.push('water.medium.ndwi_range_and_rain3');
        }
      } else if (lowOnlyTrigger) {
        waterSeverity = 'low';
        rulesFired.push('water.low.ndwi_loose_and_rain3_lt2');
      }

      if (waterSeverity) {
        waterReason =
          waterSeverity === 'high'
            ? `Low surface moisture (NDWI=${ndwiLatest.toFixed(3)}) and limited rainfall expected (7d=${rain7.toFixed(
                1
              )}mm).`
            : waterSeverity === 'medium'
            ? `Low surface moisture (NDWI=${ndwiLatest.toFixed(
                3
              )}) with insufficient rain in next 3 days (${rain3.toFixed(1)}mm).`
            : `Borderline low surface moisture (NDWI=${ndwiLatest.toFixed(
                3
              )}) and very low rain in next 3 days (${rain3.toFixed(1)}mm).`;

        recs.push({
          type: 'water',
          severity: waterSeverity,
          reason: waterReason,
          details: {
            date,
            window: { from, to },
            indices: {
              latest: { ndvi: ndviLatest, ndwi: ndwiLatest, tdvi: tdviLatest, timestamp: latest?.timestamp || null },
              fourteen_ago: { ndvi: ndvi14, timestamp: fourteenAgo?.timestamp || null },
              delta_ndvi_14d: deltaNDVI,
            },
            forecast: {
              rain_3d_mm: rain3,
              rain_7d_mm: rain7,
              days: Array.isArray(fc?.data?.days) ? fc.data.days : [],
            },
            thresholds: {
              WATER_NDWI_THRESHOLD,
              WATER_RAIN_MM_MIN,
            },
            rules_fired: rulesFired.filter((r) => r.startsWith('water.')),
          },
        });
      }
    }

    // 4) Fertilizer alert heuristic
    // Trigger: NDVI stagnation over last 14d (delta < NDVI_GROWTH_MIN) AND TDVI > TDVI_STRESS_THRESHOLD
    // Severity scaling by stagnation magnitude:
    //   - high: delta < NDVI_GROWTH_MIN/2 OR TDVI > TDVI_STRESS_THRESHOLD + 0.1
    //   - medium: otherwise (delta in [NDVI_GROWTH_MIN/2, NDVI_GROWTH_MIN))
    if (deltaNDVI != null && tdviLatest != null) {
      const stagnates = deltaNDVI < NDVI_GROWTH_MIN;
      const stressed = tdviLatest > TDVI_STRESS_THRESHOLD;
      if (stagnates && stressed) {
        let fertSeverity = 'medium';
        if (deltaNDVI < NDVI_GROWTH_MIN / 2 || tdviLatest > TDVI_STRESS_THRESHOLD + 0.1) {
          fertSeverity = 'high';
          rulesFired.push('fertilizer.high.delta_or_tdvi_margin');
        } else {
          rulesFired.push('fertilizer.medium.delta_under_threshold');
        }
        const fertReason =
          fertSeverity === 'high'
            ? `Vegetation growth stagnation (ΔNDVI=${deltaNDVI.toFixed(
                3
              )} in 14d) with strong stress (TDVI=${tdviLatest.toFixed(2)}).`
            : `Vegetation growth stagnation (ΔNDVI=${deltaNDVI.toFixed(
                3
              )} in 14d) with stress (TDVI=${tdviLatest.toFixed(2)}).`;

        recs.push({
          type: 'fertilizer',
          severity: fertSeverity,
          reason: fertReason,
          details: {
            date,
            window: { from, to },
            indices: {
              latest: { ndvi: ndviLatest, ndwi: ndwiLatest, tdvi: tdviLatest, timestamp: latest?.timestamp || null },
              fourteen_ago: { ndvi: ndvi14, timestamp: fourteenAgo?.timestamp || null },
              delta_ndvi_14d: deltaNDVI,
            },
            forecast: {
              rain_3d_mm: rain3,
              rain_7d_mm: rain7,
            },
            thresholds: { NDVI_GROWTH_MIN, TDVI_STRESS_THRESHOLD },
            rules_fired: rulesFired.filter((r) => r.startsWith('fertilizer.')),
          },
        });
      }
    }

    const result = { recommendations: recs, meta: { cache_hit: false, rules_fired: rulesFired, latency_ms: Date.now() - tStart } };
    await cacheSetJSON(computeKey, result, RECO_TTL_COMPUTE_SECONDS);
    logger.info('recommendations.compute.cached', {
      field_id: fieldId,
      date,
      count: recs.length,
      ttl: RECO_TTL_COMPUTE_SECONDS,
    });
    return result;
  }

  /**
   * Upsert recommendations by (field_id, timestamp, type)
   * - If recompute=false and exists, returns existing without update.
   * - If recompute=true, updates severity/reason/details and updated_at.
   *
   * Returns array of persisted rows.
   */
  async upsertRecommendations(fieldId, date, recommendations, { recompute = false } = {}) {
    if (!fieldId) throw new ValidationError('fieldId is required');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) {
      throw new ValidationError('date must be YYYY-MM-DD', { field: 'date' });
    }
    if (!Array.isArray(recommendations)) {
      throw new ValidationError('recommendations must be an array');
    }

    const ts = toISODate(date);
    const persisted = [];

    for (const r of recommendations) {
      const recType = r.type;
      const severity = r.severity;
      const reason = r.reason || '';
      const details = r.details ? JSON.stringify(r.details) : null;

      if (!['water', 'fertilizer'].includes(recType)) continue;
      if (!['low', 'medium', 'high'].includes(severity)) continue;

      if (recompute) {
        // Upsert with update
        await sequelize.query(
          `
          INSERT INTO recommendations (field_id, "timestamp", type, severity, reason, details)
          VALUES (:fieldId, :ts, :type, :severity, :reason, CAST(:details AS JSONB))
          ON CONFLICT (field_id, "timestamp", type)
          DO UPDATE SET
            severity = EXCLUDED.severity,
            reason = EXCLUDED.reason,
            details = EXCLUDED.details,
            updated_at = NOW()
          `,
          {
            type: QueryTypes.INSERT,
            replacements: { fieldId, ts, type: recType, severity, reason, details },
          }
        );
      } else {
        // Insert-or-ignore
        await sequelize.query(
          `
          INSERT INTO recommendations (field_id, "timestamp", type, severity, reason, details)
          VALUES (:fieldId, :ts, :type, :severity, :reason, CAST(:details AS JSONB))
          ON CONFLICT (field_id, "timestamp", type)
          DO NOTHING
          `,
          {
            type: QueryTypes.INSERT,
            replacements: { fieldId, ts, type: recType, severity, reason, details },
          }
        );
      }

      // Fetch current row
      const rows = await sequelize.query(
        `
        SELECT id, field_id, "timestamp", type, severity, reason, details, created_at, updated_at
        FROM recommendations
        WHERE field_id = :fieldId AND "timestamp" = :ts AND type = :type
        LIMIT 1
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { fieldId, ts, type: recType },
        }
      );
      if (rows[0]) persisted.push(rows[0]);
    }

    // Invalidate list caches for this field
    await this.invalidateListCache(fieldId);

    return persisted;
  }

  /**
   * List recommendations for a field with optional filters and pagination.
   * Caches each unique filter set for 5 minutes. Invalidated on upsert.
   *
   * filters: { from?: date, to?: date, type?: 'water'|'fertilizer', page?: int>=1, pageSize?: int 1..100 }
   * returns: { data, pagination }
   */
  async listRecommendations(fieldId, filters = {}) {
    if (!fieldId) throw new ValidationError('fieldId is required');

    const {
      from,
      to,
      type,
      page = 1,
      pageSize = 20,
    } = filters;

    if (from && !/^\d{4}-\d{2}-\d{2}$/.test(String(from))) {
      throw new ValidationError('from must be YYYY-MM-DD', { field: 'from' });
    }
    if (to && !/^\d{4}-\d{2}-\d{2}$/.test(String(to))) {
      throw new ValidationError('to must be YYYY-MM-DD', { field: 'to' });
    }
    if (from && to && from > to) {
      throw new ValidationError('from must be less than or equal to to');
    }
    if (type && !['water', 'fertilizer'].includes(type)) {
      throw new ValidationError('type must be water or fertilizer', { field: 'type' });
    }

    const limit = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const pageNum = Math.max(1, parseInt(page, 10));
    const offset = (pageNum - 1) * limit;

    // Cache lookup
    const cacheKey = this.listCacheKey(fieldId, { from, to, type, page: pageNum, pageSize: limit });
    const cached = await cacheGetJSON(cacheKey);
    if (cached && Array.isArray(cached.data)) {
      return cached;
    }

    // Build WHERE
    const where = ['r.field_id = :fieldId'];
    const params = { fieldId, limit, offset };
    if (from) {
      where.push(`r."timestamp" >= :from`);
      params.from = `${from}T00:00:00.000Z`;
    }
    if (to) {
      where.push(`r."timestamp" <= :to`);
      params.to = `${to}T23:59:59.999Z`;
    }
    if (type) {
      where.push(`r.type = :type`);
      params.type = type;
    }

    const rows = await sequelize.query(
      `
      SELECT
        r.id, r.field_id, r."timestamp", r.type, r.severity, r.reason, r.details, r.created_at, r.updated_at,
        COUNT(*) OVER() AS total_count
      FROM recommendations r
      WHERE ${where.join(' AND ')}
      ORDER BY r."timestamp" DESC, r.id
      LIMIT :limit OFFSET :offset
      `,
      {
        type: QueryTypes.SELECT,
        replacements: params,
      }
    );

    const total = rows.length ? Number(rows[0].total_count) : 0;
    const data = rows.map(({ total_count, ...rec }) => rec);
    const payload = {
      data,
      pagination: {
        page: pageNum,
        pageSize: limit,
        total,
      },
    };

    await cacheSetJSON(cacheKey, payload, RECO_TTL_LIST_SECONDS);
    return payload;
  }

  /**
   * Best-effort invalidation of list caches for a field.
   * Uses SCAN to delete keys matching recommendations:list:{fieldId}:*
   */
  async invalidateListCache(fieldId) {
    try {
      const redis = await getRedis();
      const pattern = `recommendations:list:${fieldId}:*`;
      if (typeof redis.scanIterator === 'function') {
        const keys = [];
        for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
          keys.push(key);
        }
        if (keys.length) {
          await redis.del(keys);
          logger.info('recommendations.cache.invalidated', { field_id: fieldId, keys: keys.length });
        }
      } else {
        // Fallback (may be disabled in production), no-op to avoid KEYS
        logger.warn('redis.scanIterator not available; skip cache invalidation by pattern.');
      }
    } catch (e) {
      // best-effort
      logger.warn('recommendations.cache.invalidate.error', { message: e.message, field_id: fieldId });
    }
  }
}

let recommendationServiceSingleton;
function getRecommendationService() {
  if (!recommendationServiceSingleton) {
    recommendationServiceSingleton = new RecommendationService();
  }
  return recommendationServiceSingleton;
}

module.exports = {
  RecommendationService,
  getRecommendationService,
};