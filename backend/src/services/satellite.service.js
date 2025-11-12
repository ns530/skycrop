'use strict';

const axios = require('axios');
const crypto = require('crypto');
const { initRedis, getRedisClient } = require('../config/redis.config');
const { ValidationError } = require('../errors/custom-errors');
const { logger } = require('../utils/logger');

/**
 * SatelliteService
 * Sprint 2 capabilities:
 * - GET tile proxy with Redis caching + ETag
 * - Preprocess job stub (queue + warming tiles)
 *
 * External: Sentinel Hub Process API (Sentinel-2 L2A)
 *
 * Notes:
 * - ETag is SHA1 of image bytes
 * - Cache key: satellite:tile:{z}:{x}:{y}:{date}:{bands}:{cloud_lt}
 * - TTL: SATELLITE_TILE_TTL_SECONDS (default 21600 = 6h)
 */
class SatelliteService {
  constructor() {
    this.redis = null;

    // Env config with sane defaults
    this.SATELLITE_TILE_TTL_SECONDS = parseInt(process.env.SATELLITE_TILE_TTL_SECONDS || '21600', 10); // 6h
    this.SATELLITE_PREPROCESS_ZOOM = parseInt(process.env.SATELLITE_PREPROCESS_ZOOM || '12', 10);
    this.SATELLITE_MAX_PREPROCESS_TILES = parseInt(process.env.SATELLITE_MAX_PREPROCESS_TILES || '200', 10);

    this.SENTINELHUB_BASE_URL = (process.env.SENTINELHUB_BASE_URL || 'https://services.sentinel-hub.com').replace(/\/+$/,'');
    this.SENTINELHUB_TOKEN_URL = process.env.SENTINELHUB_TOKEN_URL || 'https://services.sentinel-hub.com/oauth/token';
    this.SENTINELHUB_CLIENT_ID = process.env.SENTINELHUB_CLIENT_ID || '';
    this.SENTINELHUB_CLIENT_SECRET = process.env.SENTINELHUB_CLIENT_SECRET || '';

    this._oauthToken = null; // { access_token, expires_at }
    this._jobs = new Map(); // in-memory job store { job_id: {...} }
    this._idempotency = new Map(); // in-memory idem store { keyHash: job_id }
  }

  async init() {
    if (!this.redis) {
      this.redis = await initRedis();
    }
    return this;
  }

  // -------------- Helpers: caching, ETag, keys

  _tileKey(z, x, y, date, bandsCsv, cloudLt) {
    const bands = bandsCsv || 'RGB';
    const cl = Number.isFinite(Number(cloudLt)) ? Number(cloudLt) : 20;
    return `satellite:tile:${z}:${x}:${y}:${date}:${bands}:${cl}`;
  }

  _sha1(buf) {
    return crypto.createHash('sha1').update(buf).digest('hex');
  }

  async _cacheGetTile(key) {
    const raw = await this.redis.get(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.data) return null;
      const body = Buffer.from(parsed.data, 'base64');
      return {
        body,
        etag: parsed.etag,
        contentType: parsed.contentType || 'image/png',
        cached_at: parsed.cached_at,
      };
    } catch {
      return null;
    }
  }

  async _cacheSetTile(key, bodyBuf, contentType, etag) {
    const payload = {
      data: bodyBuf.toString('base64'),
      etag,
      contentType: contentType || 'image/png',
      cached_at: new Date().toISOString(),
    };
    if (typeof this.redis.setEx === 'function') {
      await this.redis.setEx(key, this.SATELLITE_TILE_TTL_SECONDS, JSON.stringify(payload));
    } else {
      await this.redis.setex(key, this.SATELLITE_TILE_TTL_SECONDS, JSON.stringify(payload));
    }
  }

  // -------------- Slippy tile conversion (Web Mercator -> WGS84 bbox)

  /**
   * Convert slippy tile z/x/y to WGS84 bbox [minLon, minLat, maxLon, maxLat]
   * Using Web Mercator formulas.
   */
  tileToBBox(z, x, y) {
    const zInt = parseInt(z, 10);
    const xInt = parseInt(x, 10);
    const yInt = parseInt(y, 10);
    if (
      !Number.isInteger(zInt) ||
      !Number.isInteger(xInt) ||
      !Number.isInteger(yInt) ||
      zInt < 0 ||
      zInt > 22
    ) {
      throw new ValidationError('Invalid tile coordinates', { z, x, y });
    }
    const n = Math.pow(2, zInt);
    if (xInt < 0 || xInt >= n || yInt < 0 || yInt >= n) {
      throw new ValidationError('Tile coordinates out of range for zoom', { z, x, y });
    }

    const lon = (xInt / n) * 360 - 180;
    const lon2 = ((xInt + 1) / n) * 360 - 180;

    const lat1 = this._tile2lat(yInt, n); // top
    const lat2 = this._tile2lat(yInt + 1, n); // bottom

    const minLon = lon;
    const maxLon = lon2;
    const minLat = lat2;
    const maxLat = lat1;

    return [minLon, minLat, maxLon, maxLat];
  }

  _tile2lat(y, n) {
    const pi = Math.PI;
    const latRad = Math.atan(Math.sinh(pi * (1 - (2 * y) / n)));
    return (latRad * 180) / Math.PI;
  }

  // -------------- OAuth

  async _getOAuthToken() {
    if (!this.SENTINELHUB_CLIENT_ID || !this.SENTINELHUB_CLIENT_SECRET) {
      // For Sprint 2 tests, allow proceeding when axios is mocked
      logger.warn('Sentinel Hub credentials are not configured; proceeding for test/mocked environment');
    }
    const now = Date.now();
    if (this._oauthToken && this._oauthToken.expires_at - 30000 > now) {
      return this._oauthToken.access_token;
    }
    const form = new URLSearchParams();
    form.set('grant_type', 'client_credentials');
    form.set('client_id', this.SENTINELHUB_CLIENT_ID);
    form.set('client_secret', this.SENTINELHUB_CLIENT_SECRET);

    const resp = await axios.post(this.SENTINELHUB_TOKEN_URL, form.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
      validateStatus: (s) => s >= 200 && s < 500,
    });
    if (resp.status < 200 || resp.status >= 300) {
      const err = new Error(`SentinelHub OAuth error (${resp.status})`);
      err.statusCode = resp.status;
      throw err;
    }
    const { access_token, expires_in } = resp.data || {};
    const expires_at = Date.now() + Math.max(30_000, Number(expires_in || 3600) * 1000);
    this._oauthToken = { access_token, expires_at };
    return access_token;
  }

  // -------------- Evalscript / bands mapping

  /**
   * Map logical bands to Sentinel-2 L2A band expressions.
   * RGB -> B04,B03,B02
   * RED -> B04, GREEN -> B03, BLUE -> B02, NIR -> B08, SWIR -> B11 (example)
   */
  _buildEvalscript(bandsCsv) {
    const list = (String(bandsCsv || 'RGB').toUpperCase())
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);

    // Default true color if RGB
    if (list.length === 1 && list[0] === 'RGB') {
      return `
        //VERSION=3
        function setup() {
          return {
            input: ["B04", "B03", "B02"],
            output: {
              bands: 3
            }
          };
        }
        function evaluatePixel(s) {
          return [s.B04, s.B03, s.B02];
        }
      `;
    }

    // Map known bands to array output
    const map = {
      RED: 'B04',
      GREEN: 'B03',
      BLUE: 'B02',
      NIR: 'B08',
      SWIR: 'B11',
    };
    const selected = list.map((b) => map[b] || 'B04');
    const bandsDecl = selected.map((b) => `"${b}"`).join(', ');
    const bandsCount = selected.length;

    return `
      //VERSION=3
      function setup() {
        return {
          input: [${bandsDecl}],
          output: { bands: ${bandsCount} }
        };
      }
      function evaluatePixel(s) {
        return [${selected.map((b) => `s.${b}`).join(', ')}];
      }
    `;
  }

  // -------------- Sentinel Hub request

  _buildProcessBody(bbox4326, date, evalscript) {
    // Minimal Process API body for an image for the given date (time window +/- 1 day)
    const from = `${date}T00:00:00Z`;
    const to = `${date}T23:59:59Z`;
    return {
      input: {
        bounds: {
          bbox: bbox4326,
          properties: {
            crs: 'http://www.opengis.net/def/crs/EPSG/0/4326',
          },
        },
        data: [
          {
            type: 'S2L2A',
            dataFilter: {
              timeRange: { from, to },
              // cloudCoverage stays un-enforced in Sprint 2, pass-through only
            },
          },
        ],
      },
      output: {
        width: 512,
        height: 512,
        responses: [{ identifier: 'default', format: { type: 'image/png' } }],
      },
      evalscript,
    };
  }

  /**
   * Fetch tile image bytes for z/x/y/date with bands and cloud_lt (no-op masking for Sprint 2).
   * Applies Redis cache and ETag support (If-None-Match).
   */
  async getTile({ z, x, y, date, bands = 'RGB', cloud_lt = 20, ifNoneMatch }) {
    await this.init();

    // Validate inputs
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) {
      throw new ValidationError('date must be YYYY-MM-DD', { field: 'date' });
    }
    const bbox = this.tileToBBox(z, x, y);

    const key = this._tileKey(z, x, y, date, String(bands).toUpperCase(), Number(cloud_lt));
    const cached = await this._cacheGetTile(key);
    if (cached) {
      const headers = {
        'Cache-Control': `public, max-age=${this.SATELLITE_TILE_TTL_SECONDS}`,
        ETag: cached.etag,
        'Content-Type': cached.contentType,
      };
      if (ifNoneMatch && ifNoneMatch === cached.etag) {
        // 304 Not Modified
        return { status: 304, headers, body: null, meta: { cache_hit: true, etag: cached.etag } };
      }
      return {
        status: 200,
        headers,
        body: cached.body,
        meta: { cache_hit: true, etag: cached.etag },
      };
    }

    // Build Sentinel Hub request
    const evalscript = this._buildEvalscript(bands);
    const processBody = this._buildProcessBody(bbox, date, evalscript);

    const token = await this._getOAuthToken();
    const url = `${this.SENTINELHUB_BASE_URL}/api/v1/process`;

    const start = Date.now();
    const resp = await axios.post(url, processBody, {
      responseType: 'arraybuffer',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'image/png',
        'Content-Type': 'application/json',
      },
      timeout: 15000,
      validateStatus: (s) => s >= 200 && s < 500,
    });

    if (resp.status < 200 || resp.status >= 300) {
      const duration = Date.now() - start;
      logger.error('satellite.tile.error', {
        status: resp.status,
        duration_ms: duration,
        route: '/api/v1/satellite/tiles',
      });
      const e = new Error(`Sentinel Hub process error (${resp.status})`);
      e.statusCode = 502;
      throw e;
    }

    const body = Buffer.from(resp.data);
    const etag = this._sha1(body);
    const contentType = resp.headers['content-type'] || 'image/png';

    await this._cacheSetTile(key, body, contentType, etag);

    const duration = Date.now() - start;
    logger.info('satellite.tile.response', {
      status: 200,
      duration_ms: duration,
      cache_hit: false,
      etag,
      route: '/api/v1/satellite/tiles',
    });

    return {
      status: 200,
      headers: {
        'Cache-Control': `public, max-age=${this.SATELLITE_TILE_TTL_SECONDS}`,
        ETag: etag,
        'Content-Type': contentType,
      },
      body,
      meta: { cache_hit: false, etag },
    };
  }

  // -------------- Preprocess job stub

  _uuid() {
    return crypto.randomUUID();
  }

  _stableHash(obj) {
    const json = JSON.stringify(obj, Object.keys(obj).sort());
    return this._sha1(Buffer.from(json));
  }

  /**
   * Queue preprocess job (warming cache for tiles covering bbox at configured zoom).
   * Idempotency: if idempotencyKey provided, ensure same payload returns same job.
   */
  async queuePreprocess({ bbox, date, bands = ['RGB'], cloud_mask = false }, idempotencyKey) {
    await this.init();

    // Validate inputs
    if (!Array.isArray(bbox) || bbox.length !== 4) {
      throw new ValidationError('bbox must be [minLon,minLat,maxLon,maxLat]', { field: 'bbox' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) {
      throw new ValidationError('date must be YYYY-MM-DD', { field: 'date' });
    }
    const minLon = Number(bbox[0]);
    const minLat = Number(bbox[1]);
    const maxLon = Number(bbox[2]);
    const maxLat = Number(bbox[3]);
    if (
      !Number.isFinite(minLon) ||
      !Number.isFinite(minLat) ||
      !Number.isFinite(maxLon) ||
      !Number.isFinite(maxLat) ||
      minLon >= maxLon ||
      minLat >= maxLat
    ) {
      throw new ValidationError('Invalid bbox extents', { field: 'bbox' });
    }
    const bandsCsv = Array.isArray(bands) ? bands.join(',') : String(bands || 'RGB');

    // Idempotency
    let idemKeyHash = null;
    if (idempotencyKey) {
      idemKeyHash = this._stableHash({ idempotencyKey, bbox, date, bands: bandsCsv, cloud_mask: !!cloud_mask });
      // In-memory map (Sprint 2 acceptable)
      if (this._idempotency.has(idemKeyHash)) {
        const existingId = this._idempotency.get(idemKeyHash);
        const job = this._jobs.get(existingId);
        if (job) {
          return { job_id: job.job_id, status: job.status };
        }
      }
    }

    const job_id = this._uuid();
    const now = new Date().toISOString();
    const job = {
      job_id,
      status: 'queued',
      bbox: [minLon, minLat, maxLon, maxLat],
      date,
      bands: bandsCsv.split(',').map((b) => b.trim()),
      cloud_mask: !!cloud_mask,
      created_at: now,
      updated_at: now,
    };
    this._jobs.set(job_id, job);
    if (idemKeyHash) this._idempotency.set(idemKeyHash, job_id);

    // Fire-and-forget worker
    setTimeout(() => {
      this._runPreprocess(job_id).catch((err) => {
        const j = this._jobs.get(job_id);
        if (j) {
          j.status = 'failed';
          j.updated_at = new Date().toISOString();
          j.error = err.message;
          this._jobs.set(job_id, j);
        }
      });
    }, 0);

    return { job_id, status: 'queued' };
  }

  getJob(job_id) {
    const j = this._jobs.get(job_id);
    if (!j) return null;
    return { job_id: j.job_id, status: j.status, updated_at: j.updated_at };
  }

  // Worker: warm tiles for bbox at configured zoom
  async _runPreprocess(job_id) {
    const job = this._jobs.get(job_id);
    if (!job) return;
    job.status = 'processing';
    job.updated_at = new Date().toISOString();
    this._jobs.set(job_id, job);

    const z = this.SATELLITE_PREPROCESS_ZOOM;
    const tiles = this._tilesForBBox(job.bbox, z);
    const limited = tiles.slice(0, this.SATELLITE_MAX_PREPROCESS_TILES);

    for (const { x, y } of limited) {
      try {
        // Warm cache: ignore body, just trigger fetch
        await this.getTile({
          z,
          x,
          y,
          date: job.date,
          bands: job.bands.join(','),
          cloud_lt: 20,
          ifNoneMatch: null,
        });
      } catch (err) {
        // Continue; warming is best-effort
        logger.warn('satellite.preprocess.warm.error', { message: err.message, x, y, z });
      }
    }

    job.status = 'completed';
    job.updated_at = new Date().toISOString();
    this._jobs.set(job_id, job);
  }

  // Compute tile indices covering bbox at zoom z
  _tilesForBBox([minLon, minLat, maxLon, maxLat], z) {
    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
    const n = Math.pow(2, z);

    const xtile = (lon) => Math.floor(((lon + 180) / 360) * n);
    const ytile = (lat) => {
      const latRad = (lat * Math.PI) / 180;
      return Math.floor(
        ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
      );
    };

    const xMin = clamp(xtile(minLon), 0, n - 1);
    const xMax = clamp(xtile(maxLon), 0, n - 1);
    const yMin = clamp(ytile(maxLat), 0, n - 1); // note inversion
    const yMax = clamp(ytile(minLat), 0, n - 1);

    const tiles = [];
    for (let x = Math.min(xMin, xMax); x <= Math.max(xMin, xMax); x += 1) {
      for (let y = Math.min(yMin, yMax); y <= Math.max(yMin, yMax); y += 1) {
        tiles.push({ z, x, y });
      }
    }
    return tiles;
  }
}

let satelliteServiceSingleton;

/**
 * Provide singleton instance.
 */
function getSatelliteService() {
  if (!satelliteServiceSingleton) {
    satelliteServiceSingleton = new SatelliteService();
  }
  return satelliteServiceSingleton;
}

module.exports = {
  SatelliteService,
  getSatelliteService,
};