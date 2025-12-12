'use strict';

const crypto = require('crypto');
const { sequelize } = require('../config/database.config');
const Field = require('../models/field.model');
const { getRedisClient, initRedis } = require('../config/redis.config');
const { ValidationError, ConflictError, NotFoundError } = require('../errors/custom-errors');

/**
 * Env & constants
 */
const FIELDCACHETTLSECLIST = parseInt(process.env.FIELDCACHETTLSECLIST || '300', 10); // 5m
const FIELDCACHETTLSECDETAIL = parseInt(process.env.FIELDCACHETTLSECDETAIL || '600', 10); // 10m

const STATUS = ['active', 'archived', 'deleted'];

/**
 * Redis helpers
 */
async function getRedis() {
  const client = getRedisClient();
  if (!client) return null;
  if (!client.isOpen) {
    await initRedis();
  }
  return client;
}

async function redisGetJSON(key) {
  const redis = await getRedis();
  if (!redis) return null;
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function redisSetJSON(key, value, ttlSec) {
  const redis = await getRedis();
  if (!redis) return;
  const payload = JSON.stringify(value);
  if (typeof redis.setEx === 'function') {
    await redis.setEx(key, ttlSec, payload);
  } else {
    // fallback alias
    await redis.setex(key, ttlSec, payload);
  }
}

async function redisDelPattern(pattern) {
  const redis = await getRedis();
  if (!redis) return;
  // Iterate with SCAN for safety
  let cursor = '0';
  do {
    const [next, keys] = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
    cursor = next;
    if (keys && keys.length) {
      await redis.del(keys);
    }
  } while (cursor !== '0');
}

/**
 * Geometry helpers
 */

// Basic GeoJSON guard (Polygon/MultiPolygon), numeric finite, lon/lat ranges
function isFiniteNumber(n) {
  return Number.isFinite(n) && !Number.isNaN(n);
}

function validatePolygonCoordinates(rings) {
  if (!Array.isArray(rings) || rings.length === 0) {
    throw new ValidationError('Polygon must have at least one linear ring', {
      field: 'boundary.coordinates',
    });
  }
  const outer = rings[0];
  if (!Array.isArray(outer) || outer.length < 4) {
    throw new ValidationError('Outer ring must have at least 4 positions (closed ring)', {
      field: 'boundary.coordinates',
    });
  }
  const first = outer[0];
  const last = outer[outer.length - 1];
  if (
    !first ||
    !last ||
    first.length < 2 ||
    last.length < 2 ||
    first[0] !== last[0] ||
    first[1] !== last[1]
  ) {
    throw new ValidationError('Outer ring must be closed (first equals last)', {
      field: 'boundary.coordinates',
    });
  }
  for (const pos of outer) {
    const [lon, lat] = pos;
    if (
      !isFiniteNumber(lon) ||
      !isFiniteNumber(lat) ||
      lon < -180 ||
      lon > 180 ||
      lat < -90 ||
      lat > 90
    ) {
      throw new ValidationError('Coordinates out of range for SRID 4326', {
        field: 'boundary.coordinates',
      });
    }
  }
}

function normalizeToMultiPolygon(geo) {
  if (!geo || typeof geo !== 'object' || !geo.type) {
    throw new ValidationError('Boundary must be a GeoJSON Polygon or MultiPolygon', {
      field: 'boundary',
    });
  }
  if (geo.type === 'Polygon') {
    validatePolygonCoordinates(geo.coordinates);
    return {
      type: 'MultiPolygon',
      coordinates: [geo.coordinates],
    };
  }
  if (geo.type === 'MultiPolygon') {
    if (!Array.isArray(geo.coordinates) || geo.coordinates.length === 0) {
      throw new ValidationError('MultiPolygon must have at least one polygon', {
        field: 'boundary.coordinates',
      });
    }
    // Validate first polygon outer ring for minimal checks
    validatePolygonCoordinates(geo.coordinates[0]);
    return geo;
  }
  throw new ValidationError('Unsupported geometry type; only Polygon or MultiPolygon accepted', {
    field: 'boundary.type',
  });
}

// Approximate area in hectares (fallback for legacy "area" column; authoritative is areasqm via DB trigger)
function approxAreaHectares(geo) {
  const polygons = geo.type === 'Polygon' ? [geo.coordinates] : geo.coordinates;
  let sumM2 = 0;

  for (const rings of polygons) {
    const outer = rings[0];
    if (!outer || outer.length < 4) continue;

    // Mean latitude for equirectangular projection
    const meanLat = outer.reduce((acc, [, lat]) => acc + lat, 0) / outer.length;
    const R = 6371000; // meters
    const latScale = (Math.PI / 180) * R;
    const lonScale = (Math.PI / 180) * R * Math.cos((meanLat * Math.PI) / 180);

    const pts = outer.map(([lon, lat]) => [lon * lonScale, lat * latScale]);

    let area2 = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];
      area2 += x1 * y2 - x2 * y1;
    }
    const outerArea = Math.abs(area2) / 2;
    sumM2 += outerArea;
    // Note: ignoring holes for simplicity in approximation (legacy column only)
  }

  return sumM2 / 10000; // hectares
}

/**
 * Filter parsing
 */
function parseBbox(bboxStr) {
  if (!bboxStr) return null;
  const parts = String(bboxStr).split(',').map(parseFloat);
  if (parts.length !== 4 || parts.some(n => !isFiniteNumber(n))) {
    throw new ValidationError('Invalid bbox format; expected "minLon,minLat,maxLon,maxLat"');
  }
  const [minLon, minLat, maxLon, maxLat] = parts;
  if (minLon >= maxLon || minLat >= maxLat) {
    throw new ValidationError('Invalid bbox extents; min must be less than max');
  }
  if (minLon < -180 || maxLon > 180 || minLat < -90 || maxLat > 90) {
    throw new ValidationError('bbox coordinates out of SRID 4326 range');
  }
  return { minLon, minLat, maxLon, maxLat };
}

function parseNear(nearStr) {
  if (!nearStr) return null;
  const parts = String(nearStr)
    .split(',')
    .map(v => v.trim());
  if (parts.length !== 3) {
    throw new ValidationError('Invalid near format; expected "lat,lon,radiusm"');
  }
  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);
  const radius = parseInt(parts[2], 10);
  if (!isFiniteNumber(lat) || lat < -90 || lat > 90) {
    throw new ValidationError('near.lat out of range');
  }
  if (!isFiniteNumber(lon) || lon < -180 || lon > 180) {
    throw new ValidationError('near.lon out of range');
  }
  if (!Number.isFinite(radius) || radius <= 0 || radius > 200000) {
    throw new ValidationError('near.radiusm must be 1..200000');
  }
  return { lat, lon, radius };
}

function parseIntersects(intersectsStr) {
  if (!intersectsStr) return null;
  const s = String(intersectsStr).trim();
  if (s.startsWith('field:')) {
    const id = s.slice('field:'.length);
    return { type: 'field', id };
  }
  // try parse as GeoJSON
  try {
    const geo = JSON.parse(s);
    const norm = normalizeToMultiPolygon(geo);
    return { type: 'geometry', geometry: norm };
  } catch {
    throw new ValidationError('intersects must be GeoJSON Polygon/MultiPolygon or "field:{uuid}"');
  }
}

function stableHash(obj) {
  const json = JSON.stringify(obj, Object.keys(obj).sort());
  return crypto.createHash('sha1').update(json).digest('hex');
}

function listCacheKey(user_id, query) {
  const base = {
    user_id,
    bbox: query.bbox || null,
    near: query.near || null,
    intersects: query.intersects || null,
    page: query.page || 1,
    pagesize: query.pagesize || 20,
    sort: query.sort || 'createdat',
    order: query.order || 'desc',
  };
  const h = stableHash(base);
  return `fields:list:${user_id}:${h}`;
}

function byIdCacheKey(field_id) {
  return `fields:byId:${field_id}`;
}

async function invalidateFieldCaches(user_id, field_id) {
  // Invalidate list caches for user and specific id cache
  await redisDelPattern(`fields:list:${user_id}:*`);
  if (field_id) {
    const redis = await getRedis();
    if (redis) {
      await redis.del(byIdCacheKey(field_id));
    }
  }
}

/**
 * Raw query builder for list with spatial filters and pagination
 */
async function queryFieldsList(user_id, filters) {
  const bbox = parseBbox(filters.bbox || null);
  const near = parseNear(filters.near || null);
  const inter = parseIntersects(filters.intersects || null);

  const params = {
    user_id,
  };

  const where = ['f.user_id = :user_id', "f.status = 'active'"];
  const joins = [];
  const conds = [];

  if (bbox) {
    params.minLon = bbox.minLon;
    params.minLat = bbox.minLat;
    params.maxLon = bbox.maxLon;
    params.maxLat = bbox.maxLat;
    conds.push(
      `f.boundary && STMakeEnvelope(:minLon, :minLat, :maxLon, :maxLat, 4326)`,
      `STIntersects(f.boundary, STMakeEnvelope(:minLon, :minLat, :maxLon, :maxLat, 4326))`
    );
  }

  if (near) {
    params.nearLat = near.lat;
    params.nearLon = near.lon;
    params.nearRadius = near.radius;
    conds.push(
      `STDWithin(f.center::geography, STSetSRID(STPoint(:nearLon, :nearLat), 4326)::geography, :nearRadius)`
    );
  }

  if (inter) {
    if (inter.type === 'field') {
      params.intersectsfield_id = inter.id;
      // Restrict lookup to same user to avoid cross-tenant leakage
      conds.push(
        `STIntersects(f.boundary, (SELECT boundary FROM fields f2 WHERE f2.field_id = :intersectsfield_id AND f2.user_id = :user_id LIMIT 1))`
      );
    } else if (inter.type === 'geometry') {
      params.intersectsGeo = JSON.stringify(inter.geometry);
      conds.push(`STIntersects(f.boundary, STSetSRID(STGeomFromGeoJSON(:intersectsGeo), 4326))`);
    }
  }

  if (conds.length) {
    where.push(...conds);
  }

  const sort = ['name', 'createdat', 'areasqm'].includes(filters.sort) ? filters.sort : 'createdat';
  const order = (filters.order || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const page = Math.max(parseInt(filters.page || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(filters.pagesize || '20', 10), 1), 100);
  const offset = (page - 1) * pageSize;

  const whereSql = where.join(' AND ');
  const baseSelect = `
    SELECT
      f.field_id,
      f.user_id,
      f.name,
      STAsGeoJSON(f.boundary)::json AS boundary,
      f.areasqm,
      STAsGeoJSON(f.center)::json AS center,
      f.status,
      f.createdat,
      f.updatedat,
      COUNT(*) OVER() AS totalcount
    FROM fields f
    ${joins.join('\n')}
    WHERE ${whereSql}
    ORDER BY ${sort} ${order}, field_id
    LIMIT :limit OFFSET :offset
  `;

  params.limit = pageSize;
  params.offset = offset;

  const rows = await sequelize.query(baseSelect, {
    type: sequelize.QueryTypes.SELECT,
    replacements: params,
  });

  const total = rows.length ? Number(rows[0].totalcount) : 0;
  // strip window column
  const data = rows.map(({ totalcount, ...r }) => r);

  return { items: data, total, page, pageSize };
}

/**
 * Service
 */
class FieldService {
  /**
   * Create Field with GeoJSON boundary (Polygon/MultiPolygon).
   * - Normalize to MultiPolygon, SRID 4326 (DB trigger ensures SRID and center/areasqm)
   * - Validate structure and lon/lat ranges
   * - Enforce name uniqueness per user
   * - Cache invalidation on success
   */
  async createWithBoundary(user_id, name, boundary) {
    if (!user_id) throw new ValidationError('user_id is required');
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Field name is required', { field: 'name' });
    }

    const existing = await Field.findOne({ where: { user_id: user_id, name: name.trim() } });
    if (existing) {
      throw new ConflictError(
        `You already have a field named '${name}'. Please choose a different name.`,
        {
          field: 'name',
        }
      );
    }

    // Normalize geometry
    let normalized;
    try {
      normalized = normalizeToMultiPolygon(boundary);
    } catch (e) {
      if (e instanceof ValidationError) throw e;
      throw new ValidationError('Invalid boundary geometry', { cause: e.message });
    }

    // Legacy area (hectares) fallback for NOT NULL column; authoritative areasqm computed in DB trigger
    const areaHa = Number(approxAreaHectares(boundary).toFixed(2));

    try {
      // Create field with placeholder values - trigger will compute actual center and areasqm
      // We use a simple point and 0 area as placeholders that satisfy Sequelize validation
      const { sequelize } = Field;

      // Create a temporary point for center (trigger will override)
      const tempCenter = {
        type: 'Point',
        coordinates: [0, 0],
      };

      const created = await Field.create({
        user_id: user_id,
        name: name.trim(),
        boundary: normalized,
        area: areaHa,
        status: 'active',
        center: tempCenter, // Placeholder - trigger will override
        areasqm: 0, // Placeholder - trigger will override
      });

      await invalidateFieldCaches(user_id, created.field_id);
      // Reload using raw to include computed columns as GeoJSON
      const one = await this.getById(user_id, created.field_id);
      return one;
    } catch (err) {
      // Map potential PostGIS validity errors to 400
      if (
        String(err.message || '').includes('Geometry') ||
        String(err.message || '').includes('STIsValid')
      ) {
        throw new ValidationError('Geometry invalid or self-intersecting', { field: 'boundary' });
      }
      throw err;
    }
  }

  /**
   * List with spatial filters, pagination, sorting
   * - Cache by user + query hash for 5m
   */
  async list(user_id, query = {}) {
    if (!user_id) throw new ValidationError('user_id is required');

    const key = listCacheKey(user_id, query);
    const cached = await redisGetJSON(key);
    if (cached) {
      return { ...cached, cacheHit: true };
    }

    const result = await queryFieldsList(user_id, query);
    await redisSetJSON(key, result, FIELDCACHETTLSECLIST);
    return { ...result, cacheHit: false };
  }

  /**
   * Get field by id (owner-only). Cached for 10m.
   */
  async getById(user_id, field_id) {
    if (!user_id || !field_id) throw new ValidationError('user_id and field_id are required');

    const key = byIdCacheKey(field_id);
    const cached = await redisGetJSON(key);
    if (cached && cached.user_id === user_id && cached.status !== 'deleted') {
      return cached;
    }

    // Use raw query to ensure GeoJSON for geometry columns
    const row = await sequelize.query(
      `
      SELECT
        f.field_id,
        f.user_id,
        f.name,
        STAsGeoJSON(f.boundary)::json AS boundary,
        f.areasqm,
        STAsGeoJSON(f.center)::json AS center,
        f.status,
        f.createdat,
        f.updatedat
      FROM fields f
      WHERE f.field_id = :field_id AND f.user_id = :user_id
      LIMIT 1
      `,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: { field_id, user_id },
      }
    );

    const field = row[0];
    if (!field || field.status === 'deleted') {
      throw new NotFoundError('Field not found');
    }

    await redisSetJSON(key, field, FIELDCACHETTLSECDETAIL);
    return field;
  }

  /**
   * Update metadata: name and/or status
   */
  async update(user_id, field_id, { name, status }) {
    const field = await Field.scope('allStatuses').findOne({
      where: { field_id: field_id, user_id: user_id },
    });
    if (!field || field.status === 'deleted') {
      throw new NotFoundError('Field not found');
    }

    if (typeof name === 'string' && name.trim().length > 0 && name.trim() !== field.name) {
      const exists = await Field.findOne({
        where: { user_id: user_id, name: name.trim() },
      });
      if (exists) {
        throw new ConflictError(
          `You already have a field named '${name}'. Please choose a different name.`,
          {
            field: 'name',
          }
        );
      }
      field.name = name.trim();
    }

    if (typeof status === 'string') {
      if (!STATUS.includes(status)) {
        throw new ValidationError('Invalid status', { field: 'status', allowed: STATUS });
      }
      field.status = status;
    }

    await field.save();
    await invalidateFieldCaches(user_id, field.field_id);
    const fresh = await this.getById(user_id, field.field_id);
    return fresh;
  }

  /**
   * Soft delete (status = 'deleted')
   */
  async delete(user_id, field_id) {
    const field = await Field.scope('allStatuses').findOne({
      where: { field_id: field_id, user_id: user_id },
    });
    if (!field || field.status === 'deleted') {
      throw new NotFoundError('Field not found');
    }
    field.status = 'deleted';
    await field.save();
    await invalidateFieldCaches(user_id, field.field_id);
    return { success: true };
  }
}

let fieldServiceSingleton;

/**
 * Provide singleton instance.
 */
function getFieldService() {
  if (!fieldServiceSingleton) {
    fieldServiceSingleton = new FieldService();
  }
  return fieldServiceSingleton;
}

module.exports = {
  FieldService,
  getFieldService,
};
