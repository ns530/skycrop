const { sequelize } = require('../../config/database.config');
const { initRedis } = require('../../config/redis.config');
const { getWeatherService } = require('../../services/weather.service');
const { getMlGatewayService } = require('../../services/mlGateway.service');
const { logger } = require('../../utils/logger');

const DASHBOARDCACHETTLSEC = parseInt(process.env.DASHBOARDCACHETTLSEC || '300', 10); // 5 minutes

/**
 * Get field count and basic info
 */
async function getFieldMetrics(userId) {
  const result = await sequelize.query(
    `
    SELECT
      COUNT(*) as totalfields,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as activefields,
      SUM(area_sqm) as totalareasqm,
      AVG(area_sqm) as avgfieldsizesqm
    FROM fields
    WHERE user_id = :userId AND status != 'deleted'
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { userId },
    }
  );

  const metrics = result[0];
  return {
    total: metrics.totalfields != null ? parseInt(metrics.totalfields, 10) : 0,
    active: metrics.activefields != null ? parseInt(metrics.activefields, 10) : 0,
    total_area_hectares:
      metrics.totalareasqm != null ? Math.round((metrics.totalareasqm / 10000) * 100) / 100 : 0,
    average_size_hectares:
      metrics.avgfieldsizesqm != null
        ? Math.round((metrics.avgfieldsizesqm / 10000) * 100) / 100
        : 0,
  };
}

/**
 * Get health status summaries
 */
async function getHealthMetrics(userId) {
  // Get latest health records for all user's fields
  const healthRecords = await sequelize.query(
    `
    SELECT
      hr.health_score AS healthscore,
      hr.health_status AS healthstatus,
      hr.ndvi_mean AS ndvimean,
      hr.ndwi_mean AS ndwimean,
      hr.measurement_date AS measurementdate,
      f.field_id,
      f.name as fieldname
    FROM health_records hr
    INNER JOIN fields f ON hr.field_id = f.field_id
    WHERE f.user_id = :userId AND f.status = 'active'
    AND hr.measurement_date = (
      SELECT MAX(hr2.measurement_date)
      FROM health_records hr2
      WHERE hr2.field_id = hr.field_id
    )
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { userId },
    }
  );

  if (healthRecords.length === 0) {
    return {
      average_score: 50,
      status_distribution: { good: 0, moderate: 0, poor: 0 },
      total_assessed: 0,
    };
  }

  const scores = healthRecords.map(r => r.healthscore);
  const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // Count by status
  const statusCount = healthRecords.reduce(
    (acc, record) => {
      const status = record.healthstatus;
      if (status === 'excellent' || status === 'good') {
        acc.good += 1;
      } else if (status === 'fair') {
        acc.moderate += 1;
      } else {
        acc.poor += 1;
      }
      return acc;
    },
    { good: 0, moderate: 0, poor: 0 }
  );

  return {
    average_score: averageScore,
    status_distribution: statusCount,
    total_assessed: healthRecords.length,
  };
}

/**
 * Get active alerts count (recommendations)
 */
async function getAlertMetrics(userId) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const alerts = await sequelize.query(
    `
    SELECT
      COUNT(*) as totalalerts,
      COUNT(CASE WHEN severity = 'high' THEN 1 END) as highseverity,
      COUNT(CASE WHEN severity = 'medium' THEN 1 END) as mediumseverity,
      COUNT(CASE WHEN severity = 'low' THEN 1 END) as lowseverity,
      COUNT(CASE WHEN type = 'water' THEN 1 END) as wateralerts,
      COUNT(CASE WHEN type = 'fertilizer' THEN 1 END) as fertilizeralerts
    FROM recommendations r
    INNER JOIN fields f ON r.field_id = f.field_id
    WHERE f.user_id = :userId AND f.status = 'active'
    AND r."timestamp" >= :sevenDaysAgo
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: {
        userId,
        sevenDaysAgo: sevenDaysAgo.toISOString(),
      },
    }
  );

  const metrics = alerts[0];
  return {
    total: metrics.totalalerts != null ? parseInt(metrics.totalalerts, 10) : 0,
    by_severity: {
      high: metrics.highseverity != null ? parseInt(metrics.highseverity, 10) : 0,
      medium: metrics.mediumseverity != null ? parseInt(metrics.mediumseverity, 10) : 0,
      low: metrics.lowseverity != null ? parseInt(metrics.lowseverity, 10) : 0,
    },
    by_type: {
      water: metrics.wateralerts != null ? parseInt(metrics.wateralerts, 10) : 0,
      fertilizer: metrics.fertilizeralerts != null ? parseInt(metrics.fertilizeralerts, 10) : 0,
    },
  };
}

/**
 * Get recent activity (last 7 days)
 */
async function getRecentActivity(userId) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Recent health assessments
  const healthActivity = await sequelize.query(
    `
    SELECT
      'healthassessment' as activitytype,
      hr.measurement_date as activitydate,
      f.name as fieldname,
      hr.health_status AS healthstatus,
      hr.health_score AS healthscore
    FROM health_records hr
    INNER JOIN fields f ON hr.field_id = f.field_id
    WHERE f.user_id = :userId AND f.status = 'active'
    AND hr.created_at >= :sevenDaysAgo
    ORDER BY hr.created_at DESC
    LIMIT 10
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { userId, sevenDaysAgo: sevenDaysAgo.toISOString() },
    }
  );

  // Recent recommendations
  const recommendationActivity = await sequelize.query(
    `
    SELECT
      'recommendation' as activitytype,
      r."timestamp" as activitydate,
      f.name as fieldname,
      r.type,
      r.severity
    FROM recommendations r
    INNER JOIN fields f ON r.field_id = f.field_id
    WHERE f.user_id = :userId AND f.status = 'active'
    AND r.created_at >= :sevenDaysAgo
    ORDER BY r.created_at DESC
    LIMIT 10
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { userId, sevenDaysAgo: sevenDaysAgo.toISOString() },
    }
  );

  // Combine and sort by date
  const allActivity = [...healthActivity, ...recommendationActivity]
    .sort((a, b) => new Date(b.activitydate) - new Date(a.activitydate))
    .slice(0, 15);

  return allActivity.map(activity => ({
    type:
      activity.activitytype === 'healthassessment' ? 'health_assessment' : activity.activitytype,
    date: activity.activitydate,
    field_name: activity.fieldname,
    details:
      activity.activitytype === 'healthassessment'
        ? { status: activity.healthstatus, score: activity.healthscore }
        : { type: activity.type, severity: activity.severity },
  }));
}

/**
 * Get field thumbnails (satellite image URLs)
 */
async function getFieldThumbnails(userId) {
  // Get fields with their centers for thumbnail generation
  const fields = await sequelize.query(
    `
    SELECT
      f.field_id,
      f.name,
      ST_AsGeoJSON(f.center)::json as center,
      f.area_sqm AS areasqm
    FROM fields f
    WHERE f.user_id = :userId AND f.status = 'active'
    ORDER BY f.created_at DESC
    LIMIT 12
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { userId },
    }
  );

  const thumbnails = await Promise.all(
    fields.map(async field => {
      try {
        const { center } = field;
        if (!center || !center.coordinates) {
          return {
            field_id: field.field_id,
            field_name: field.name,
            thumbnail_url: null,
            area_hectares: Math.round((field.areasqm / 10000) * 100) / 100,
          };
        }

        // Generate a tile URL for the field center
        // Using zoom level 14 for field-level view
        const [lon, lat] = center.coordinates;
        const zoom = 14;

        // Convert lat/lon to tile coordinates
        const n = 2 ** zoom;
        const x = Math.floor(((lon + 180) / 360) * n);
        const y = Math.floor(
          ((1 -
            Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) /
              Math.PI) /
            2) *
            n
        );

        // Get today's date for recent imagery
        const today = new Date().toISOString().split('T')[0];

        // Generate tile URL (this would be the API endpoint for tiles)
        const thumbnailurl = `/api/v1/satellite/tiles/${zoom}/${x}/${y}?date=${today}&bands=RGB`;

        return {
          field_id: field.field_id,
          field_name: field.name,
          thumbnail_url: thumbnailurl,
          area_hectares: Math.round((field.areasqm / 10000) * 100) / 100,
        };
      } catch (error) {
        logger.warn('dashboard.thumbnail.error', {
          fieldId: field.field_id,
          error: error.message,
        });
        return {
          field_id: field.field_id,
          field_name: field.name,
          thumbnail_url: null,
          area_hectares: Math.round((field.areasqm / 10000) * 100) / 100,
        };
      }
    })
  );

  return thumbnails;
}

/**
 * Get vegetation indices (NDVI, NDWI, TDVI) averages
 */
async function getVegetationIndices(userId) {
  const result = await sequelize.query(
    `
    SELECT
      AVG(hr.ndvi_mean) as avgndvi,
      AVG(hr.ndwi_mean) as avgndwi,
      AVG(hr.tdvi_mean) as avgtdvi,
      COUNT(*) as totalrecords
    FROM health_records hr
    INNER JOIN fields f ON hr.field_id = f.field_id
    WHERE f.user_id = :userId AND f.status = 'active'
    AND hr.measurement_date >= CURRENT_DATE - INTERVAL '30 days'
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { userId },
    }
  );

  const metrics = result[0];
  return {
    ndvi: metrics.avgndvi != null ? Number(Number(metrics.avgndvi).toFixed(3)) : 0,
    ndwi: metrics.avgndwi != null ? Number(Number(metrics.avgndwi).toFixed(3)) : 0,
    tdvi: metrics.avgtdvi != null ? Number(Number(metrics.avgtdvi).toFixed(3)) : 0,
    total_records: metrics.totalrecords != null ? parseInt(metrics.totalrecords, 10) : 0,
  };
}

/**
 * Get system metrics (uptime, API performance)
 */
async function getSystemMetrics() {
  const redis = await initRedis();

  // System uptime (process uptime in hours)
  const uptimeHours = Math.floor(process.uptime() / 3600);

  // API performance from Redis (average response time over last hour)
  let avgResponseTime = null;
  if (redis) {
    const perfKey = 'api:performance:lasthour';
    const perfData = await redis.get(perfKey);
    if (perfData) {
      try {
        const parsed = JSON.parse(perfData);
        avgResponseTime = parsed.avgresponsetimems || null;
      } catch (e) {
        // ignore
      }
    }
  }

  return {
    uptime_hours: uptimeHours,
    api_performance: {
      avg_response_time_ms: avgResponseTime != null ? avgResponseTime : 0,
    },
  };
}

/**
 * Get weather forecast for user's first field
 */
async function getWeatherForecast(userId) {
  try {
    const weatherService = getWeatherService();

    // Get user's first active field
    const fieldResult = await sequelize.query(
      `
      SELECT field_id
      FROM fields
      WHERE user_id = :userId AND status = 'active'
      ORDER BY created_at ASC
      LIMIT 1
      `,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: { userId },
      }
    );

    if (fieldResult.length === 0) {
      return { forecast: [], available: false };
    }

    const { field_id: fieldId } = fieldResult[0];
    const forecast = await weatherService.getForecast(userId, fieldId);

    return {
      forecast: forecast.data.days.slice(0, 7),
      totals: forecast.data.totals,
      available: true,
    };
  } catch (error) {
    logger.warn('dashboard.weatherforecast.error', { error: error.message });
    return { forecast: [], available: false };
  }
}

/**
 * Get user analytics (mock for now, would integrate with Firebase)
 */
async function getUserAnalytics(userId) {
  // Mock analytics - in real implementation, fetch from Firebase Analytics
  const result = await sequelize.query(
    `
    SELECT
      COUNT(DISTINCT f.field_id) as totalfields,
      COUNT(hr.record_id) as totalassessments,
      AVG(hr.health_score) as avghealthscore,
      MAX(hr.created_at) as lastactivity
    FROM fields f
    LEFT JOIN health_records hr ON f.field_id = hr.field_id
    WHERE f.user_id = :userId AND f.status = 'active'
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { userId },
    }
  );

  const metrics = result[0];
  return {
    total_fields: metrics.totalfields != null ? parseInt(metrics.totalfields, 10) : 0,
    total_assessments:
      metrics.totalassessments != null ? parseInt(metrics.totalassessments, 10) : 0,
    avg_health_score:
      metrics.avghealthscore != null ? Number(Number(metrics.avghealthscore).toFixed(1)) : 0,
    last_activity: metrics.lastactivity || null,
    active_users_today: 1, // mock
    session_duration_avg: 15.5, // mock in minutes
  };
}

/**
 * Get disaster assessment (integrate with ML service)
 */
async function getDisasterAssessment(userId) {
  try {
    const mlService = getMlGatewayService();

    // Get user's fields
    const fieldsResult = await sequelize.query(
      `
      SELECT field_id, name
      FROM fields
      WHERE user_id = :userId AND status = 'active'
      `,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: { userId },
      }
    );

    if (fieldsResult.length === 0) {
      return { assessments: [], available: false };
    }

    // For each field, get latest disaster assessment
    const assessments = await Promise.all(
      fieldsResult.map(async field => {
        try {
          const assessment = await mlService.getDisasterAssessment(field.field_id);
          return {
            field_id: field.field_id,
            field_name: field.name,
            risk_level: assessment.risklevel,
            disaster_types: assessment.disastertypes,
            confidence: assessment.confidence,
            assessed_at: assessment.assessedat,
          };
        } catch (error) {
          return {
            field_id: field.field_id,
            field_name: field.name,
            risk_level: 'unknown',
            disaster_types: [],
            confidence: 0,
            assessed_at: null,
          };
        }
      })
    );

    return {
      assessments,
      available: true,
      high_risk_count: assessments.filter(a => a.risk_level === 'high').length,
    };
  } catch (error) {
    logger.warn('dashboard.disasterassessment.error', { error: error.message });
    return { assessments: [], available: false };
  }
}

/**
 * Aggregate dashboard metrics from multiple sources
 * Uses Promise.allSettled to ensure partial failures don't break the entire dashboard
 */
async function aggregateDashboardMetrics(userId) {
  const results = await Promise.allSettled([
    getFieldMetrics(userId),
    getHealthMetrics(userId),
    getAlertMetrics(userId),
    getRecentActivity(userId),
    getFieldThumbnails(userId),
    getVegetationIndices(userId),
    getSystemMetrics(),
    getWeatherForecast(userId),
    getUserAnalytics(userId),
    getDisasterAssessment(userId),
  ]);

  // Helper to extract value or default
  const getValue = (result, defaultValue) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    logger.warn('dashboard.metrics.partialfailure', {
      error: result.reason?.message || 'Unknown error',
      stack: result.reason?.stack,
    });
    return defaultValue;
  };

  return {
    fields: getValue(results[0], {
      total: 0,
      active: 0,
      total_area_hectares: 0,
      average_size_hectares: 0,
    }),
    health: getValue(results[1], {
      average_score: 50,
      status_distribution: { good: 0, moderate: 0, poor: 0 },
      total_assessed: 0,
    }),
    alerts: getValue(results[2], {
      total: 0,
      by_severity: { high: 0, medium: 0, low: 0 },
      by_type: { water: 0, fertilizer: 0 },
    }),
    recent_activity: getValue(results[3], []),
    field_thumbnails: getValue(results[4], []),
    vegetation_indices: getValue(results[5], {
      ndvi: 0,
      ndwi: 0,
      tdvi: 0,
      total_records: 0,
    }),
    system: getValue(results[6], { uptime_hours: 0, api_performance: { avg_response_time_ms: 0 } }),
    weather_forecast: getValue(results[7], { forecast: [], available: false }),
    user_analytics: getValue(results[8], {
      total_fields: 0,
      total_assessments: 0,
      avg_health_score: 0,
      last_activity: null,
      active_users_today: 1,
      session_duration_avg: 15.5,
    }),
    disaster_assessment: getValue(results[9], {
      assessments: [],
      available: false,
      high_risk_count: 0,
    }),
    generated_at: new Date().toISOString(),
  };
}

/**
 * Dashboard Controller
 * Provides aggregated metrics for dashboard display.
 */
module.exports = {
  // GET /api/v1/dashboard/metrics
  async getMetrics(req, res, next) {
    const started = Date.now();
    const correlationId = req.headers['x-request-id'] || null;
    try {
      const { user_id: userId } = req.user;
      const cacheKey = `dashboard:metrics:${userId}`;

      // Try cache first
      const redis = await initRedis();
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          logger.info('dashboard.metrics.cachehit', {
            userId,
            correlationid: correlationId,
          });
          return res.status(200).json({
            success: true,
            data: parsed,
            meta: {
              correlationid: correlationId,
              cachehit: true,
              latencyms: Date.now() - started,
            },
          });
        }
      }

      // Aggregate metrics
      const metrics = await aggregateDashboardMetrics(userId);

      // Cache the result (if Redis is available)
      if (redis) {
        await redis.setEx(cacheKey, DASHBOARDCACHETTLSEC, JSON.stringify(metrics));
      }

      const latency = Date.now() - started;
      logger.info('dashboard.metrics', {
        userId,
        correlationid: correlationId,
        latencyms: latency,
        cachehit: false,
      });

      return res.status(200).json({
        success: true,
        data: metrics,
        meta: {
          correlationid: correlationId,
          cachehit: false,
          latencyms: latency,
        },
      });
    } catch (err) {
      return next(err);
    }
  },
};
