const axios = require('axios');
const crypto = require('crypto');
const { initRedis, getRedisClient: _getRedisClient } = require('../config/redis.config');
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
 * - Cache key: satellite:tile:{z}:{x}:{y}:{date}:{bands}:{cloudlt}
 * - TTL: SATELLITETILETTLSECONDS (default 21600 = 6h)
 */
class SatelliteService {
  constructor() {
    this.redis = null;

    // Env config with sane defaults
    this.SATELLITETILETTLSECONDS = parseInt(process.env.SATELLITETILETTLSECONDS || '21600', 10); // 6h
    this.SATELLITEPREPROCESSZOOM = parseInt(process.env.SATELLITEPREPROCESSZOOM || '12', 10);
    this.SATELLITEMAXPREPROCESSTILES = parseInt(
      process.env.SATELLITEMAXPREPROCESSTILES || '200',
      10
    );

    this.SENTINELHUBBASEURL = (
      process.env.SENTINELHUBBASEURL || 'https://services.sentinel-hub.com'
    ).replace(/\/+$/, '');
    this.SENTINELHUBTOKENURL =
      process.env.SENTINELHUBTOKENURL || 'https://services.sentinel-hub.com/oauth/token';
    this.SENTINELHUBCLIENTID = process.env.SENTINELHUBCLIENTID || '';
    this.SENTINELHUBCLIENTSECRET = process.env.SENTINELHUBCLIENTSECRET || '';

    this.oauthToken = null; // { accesstoken, expiresat }
    this.jobs = new Map(); // in-memory job store { jobid: {...} }
    this.idempotency = new Map(); // in-memory idem store { keyHash: jobid }
  }

  async init() {
    if (!this.redis) {
      this.redis = await initRedis();
    }
    return this;
  }

  // -------------- Helpers: caching, ETag, keys

  tileKey(z, x, y, date, bandsCsv, cloudLt) {
    const bands = bandsCsv || 'RGB';
    const cl = Number.isFinite(Number(cloudLt)) ? Number(cloudLt) : 20;
    return `satellite:tile:${z}:${x}:${y}:${date}:${bands}:${cl}`;
  }

  sha1(buf) {
    return crypto.createHash('sha1').update(buf).digest('hex');
  }

  async cacheGetTile(key) {
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
        cachedat: parsed.cachedat,
      };
    } catch {
      return null;
    }
  }

  async cacheSetTile(key, bodyBuf, contentType, etag) {
    const payload = {
      data: bodyBuf.toString('base64'),
      etag,
      contentType: contentType || 'image/png',
      cachedat: new Date().toISOString(),
    };
    if (typeof this.redis.setEx === 'function') {
      await this.redis.setEx(key, this.SATELLITETILETTLSECONDS, JSON.stringify(payload));
    } else {
      await this.redis.setex(key, this.SATELLITETILETTLSECONDS, JSON.stringify(payload));
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
    const n = 2 ** zInt;
    if (xInt < 0 || xInt >= n || yInt < 0 || yInt >= n) {
      throw new ValidationError('Tile coordinates out of range for zoom', { z, x, y });
    }

    const lon = (xInt / n) * 360 - 180;
    const lon2 = ((xInt + 1) / n) * 360 - 180;

    const lat1 = this.tile2lat(yInt, n); // top
    const lat2 = this.tile2lat(yInt + 1, n); // bottom

    const minLon = lon;
    const maxLon = lon2;
    const minLat = lat2;
    const maxLat = lat1;

    return [minLon, minLat, maxLon, maxLat];
  }

  tile2lat(y, n) {
    const pi = Math.PI;
    const latRad = Math.atan(Math.sinh(pi * (1 - (2 * y) / n)));
    return (latRad * 180) / Math.PI;
  }

  // -------------- OAuth

  async getOAuthToken() {
    if (!this.SENTINELHUBCLIENTID || !this.SENTINELHUBCLIENTSECRET) {
      // For Sprint 2 tests, allow proceeding when axios is mocked
      logger.warn(
        'Sentinel Hub credentials are not configured; proceeding for test/mocked environment'
      );
    }
    const now = Date.now();
    if (this.oauthToken && this.oauthToken.expiresat - 30000 > now) {
      return this.oauthToken.accesstoken;
    }
    const form = new URLSearchParams();
    form.set('granttype', 'clientcredentials');
    form.set('clientid', this.SENTINELHUBCLIENTID);
    form.set('clientsecret', this.SENTINELHUBCLIENTSECRET);

    const resp = await axios.post(this.SENTINELHUBTOKENURL, form.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
      validateStatus: s => s >= 200 && s < 500,
    });
    if (resp.status < 200 || resp.status >= 300) {
      const err = new Error(`SentinelHub OAuth error (${resp.status})`);
      err.statusCode = resp.status;
      throw err;
    }
    const { accesstoken, expiresin } = resp.data || {};
    const expiresat = Date.now() + Math.max(30_000, Number(expiresin || 3600) * 1000);
    this.oauthToken = { accesstoken, expiresat };
    return accesstoken;
  }

  // -------------- Evalscript / bands mapping

  /**
   * Map logical bands to Sentinel-2 L2A band expressions.
   * RGB -> B04,B03,B02
   * RED -> B04, GREEN -> B03, BLUE -> B02, NIR -> B08, SWIR -> B11 (example)
   */
  buildEvalscript(bandsCsv) {
    const list = String(bandsCsv || 'RGB')
      .toUpperCase()
      .split(',')
      .map(b => b.trim())
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
    const selected = list.map(b => map[b] || 'B04');
    const bandsDecl = selected.map(b => `"${b}"`).join(', ');
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
        return [${selected.map(b => `s.${b}`).join(', ')}];
      }
    `;
  }

  // -------------- Sentinel Hub request

  buildProcessBody(bbox4326, date, evalscript) {
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
   * Fetch tile image bytes for z/x/y/date with bands and cloudlt (no-op masking for Sprint 2).
   * Applies Redis cache and ETag support (If-None-Match).
   */
  async getTile({ z, x, y, date, bands = 'RGB', cloudlt = 20, ifNoneMatch }) {
    await this.init();

    // Validate inputs
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) {
      throw new ValidationError('date must be YYYY-MM-DD', { field: 'date' });
    }
    const bbox = this.tileToBBox(z, x, y);

    const key = this.tileKey(z, x, y, date, String(bands).toUpperCase(), Number(cloudlt));
    const cached = await this.cacheGetTile(key);
    if (cached) {
      const headers = {
        'Cache-Control': `public, max-age=${this.SATELLITETILETTLSECONDS}`,
        ETag: cached.etag,
        'Content-Type': cached.contentType,
      };
      if (ifNoneMatch && ifNoneMatch === cached.etag) {
        // 304 Not Modified
        return { status: 304, headers, body: null, meta: { cachehit: true, etag: cached.etag } };
      }
      return {
        status: 200,
        headers,
        body: cached.body,
        meta: { cachehit: true, etag: cached.etag },
      };
    }

    // Build Sentinel Hub request
    const evalscript = this.buildEvalscript(bands);
    const processBody = this.buildProcessBody(bbox, date, evalscript);

    const token = await this.getOAuthToken();
    const url = `${this.SENTINELHUBBASEURL}/api/v1/process`;

    const start = Date.now();
    const resp = await axios.post(url, processBody, {
      responseType: 'arraybuffer',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'image/png',
        'Content-Type': 'application/json',
      },
      timeout: 15000,
      validateStatus: s => s >= 200 && s < 500,
    });

    if (resp.status < 200 || resp.status >= 300) {
      const duration = Date.now() - start;
      logger.error('satellite.tile.error', {
        status: resp.status,
        durationms: duration,
        route: '/api/v1/satellite/tiles',
      });
      const e = new Error(`Sentinel Hub process error (${resp.status})`);
      e.statusCode = 502;
      throw e;
    }

    const body = Buffer.from(resp.data);
    const etag = this.sha1(body);
    const contentType = resp.headers['content-type'] || 'image/png';

    await this.cacheSetTile(key, body, contentType, etag);

    const duration = Date.now() - start;
    logger.info('satellite.tile.response', {
      status: 200,
      durationms: duration,
      cachehit: false,
      etag,
      route: '/api/v1/satellite/tiles',
    });

    return {
      status: 200,
      headers: {
        'Cache-Control': `public, max-age=${this.SATELLITETILETTLSECONDS}`,
        ETag: etag,
        'Content-Type': contentType,
      },
      body,
      meta: { cachehit: false, etag },
    };
  }

  // -------------- Preprocess job stub

  uuid() {
    return crypto.randomUUID();
  }

  stableHash(obj) {
    const json = JSON.stringify(obj, Object.keys(obj).sort());
    return this.sha1(Buffer.from(json));
  }

  /**
   * Queue preprocess job (warming cache for tiles covering bbox at configured zoom).
   * Idempotency: if idempotencyKey provided, ensure same payload returns same job.
   */
  async queuePreprocess({ bbox, date, bands = ['RGB'], cloudmask = false }, idempotencyKey) {
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
      idemKeyHash = this.stableHash({
        idempotencyKey,
        bbox,
        date,
        bands: bandsCsv,
        cloudmask: !!cloudmask,
      });
      // In-memory map (Sprint 2 acceptable)
      if (this.idempotency.has(idemKeyHash)) {
        const existingId = this.idempotency.get(idemKeyHash);
        const job = this.jobs.get(existingId);
        if (job) {
          return { jobid: job.jobid, status: job.status };
        }
      }
    }

    const jobid = this.uuid();
    const now = new Date().toISOString();
    const job = {
      jobid,
      status: 'queued',
      bbox: [minLon, minLat, maxLon, maxLat],
      date,
      bands: bandsCsv.split(',').map(b => b.trim()),
      cloudmask: !!cloudmask,
      createdat: now,
      updatedat: now,
    };
    this.jobs.set(jobid, job);
    if (idemKeyHash) this.idempotency.set(idemKeyHash, jobid);

    // Fire-and-forget worker
    setTimeout(() => {
      this.runPreprocess(jobid).catch(err => {
        const j = this.jobs.get(jobid);
        if (j) {
          j.status = 'failed';
          j.updatedat = new Date().toISOString();
          j.error = err.message;
          this.jobs.set(jobid, j);
        }
      });
    }, 0);

    return { jobid, status: 'queued' };
  }

  getJob(jobid) {
    const j = this.jobs.get(jobid);
    if (!j) return null;
    return { jobid: j.jobid, status: j.status, updatedat: j.updatedat };
  }

  // Worker: warm tiles for bbox at configured zoom
  async runPreprocess(jobid) {
    const job = this.jobs.get(jobid);
    if (!job) return;
    job.status = 'processing';
    job.updatedat = new Date().toISOString();
    this.jobs.set(jobid, job);

    const z = this.SATELLITEPREPROCESSZOOM;
    const tiles = this.tilesForBBox(job.bbox, z);
    const limited = tiles.slice(0, this.SATELLITEMAXPREPROCESSTILES);

    for (const { x, y } of limited) {
      try {
        // Warm cache: ignore body, just trigger fetch
        await this.getTile({
          z,
          x,
          y,
          date: job.date,
          bands: job.bands.join(','),
          cloudlt: 20,
          ifNoneMatch: null,
        });
      } catch (err) {
        // Continue; warming is best-effort
        logger.warn('satellite.preprocess.warm.error', { message: err.message, x, y, z });
      }
    }

    job.status = 'completed';
    job.updatedat = new Date().toISOString();
    this.jobs.set(jobid, job);
  }

  // Compute tile indices covering bbox at zoom z
  tilesForBBox([minLon, minLat, maxLon, maxLat], z) {
    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
    const n = 2 ** z;

    const xtile = lon => Math.floor(((lon + 180) / 360) * n);
    const ytile = lat => {
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
