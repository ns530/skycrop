'use strict';

const { sequelize } = require('../../config/database.config');
const { getRedisClient, initRedis } = require('../../config/redis.config');
const { getFieldHealthService } = require('../../services/fieldHealth.service');
const { getSatelliteService } = require('../../services/satellite.service');
const { logger } = require('../../utils/logger');

const DASHBOARD_CACHE_TTL_SEC = parseInt(process.env.DASHBOARD_CACHE_TTL_SEC || '300', 10); // 5 minutes

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
      const userId = req.user.userId;
      const cacheKey = `dashboard:metrics:${userId}`;

      // Try cache first
      const redis = await initRedis();
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        logger.info('dashboard.metrics.cache_hit', {
          user_id: userId,
          correlation_id: correlationId,
        });
        return res.status(200).json({
          success: true,
          data: parsed,
          meta: {
            correlation_id: correlationId,
            cache_hit: true,
            latency_ms: Date.now() - started
          },
        });
      }

      // Aggregate metrics
      const metrics = await aggregateDashboardMetrics(userId);

      // Cache the result
      await redis.setEx(cacheKey, DASHBOARD_CACHE_TTL_SEC, JSON.stringify(metrics));

      const latency = Date.now() - started;
      logger.info('dashboard.metrics', {
        user_id: userId,
        correlation_id: correlationId,
        latency_ms: latency,
        cache_hit: false,
      });

      return res.status(200).json({
        success: true,
        data: metrics,
        meta: {
          correlation_id: correlationId,
          cache_hit: false,
          latency_ms: latency
        },
      });
    } catch (err) {
      return next(err);
    }
  },
};

/**
 * Aggregate dashboard metrics from multiple sources
 */
async function aggregateDashboardMetrics(userId) {
  const [
    fieldMetrics,
    healthMetrics,
    alertMetrics,
    recentActivity,
    fieldThumbnails,
    vegetationIndices,
    systemMetrics,
    weatherForecast,
    userAnalytics,
    disasterAssessment
  ] = await Promise.all([
    getFieldMetrics(userId),
    getHealthMetrics(userId),
    getAlertMetrics(userId),
    getRecentActivity(userId),
    getFieldThumbnails(userId),
    getVegetationIndices(userId),
    getSystemMetrics(),
    getWeatherForecast(userId),
    getUserAnalytics(userId),
    getDisasterAssessment(userId)
  ]);

  return {
    fields: fieldMetrics,
    health: healthMetrics,
    alerts: alertMetrics,
    recent_activity: recentActivity,
    field_thumbnails: fieldThumbnails,
    vegetation_indices: vegetationIndices,
    system: systemMetrics,
    weather_forecast: weatherForecast,
    user_analytics: userAnalytics,
    disaster_assessment: disasterAssessment,
    generated_at: new Date().toISOString()
  };
}

/**
 * Get field count and basic info
 */
async function getFieldMetrics(userId) {
  const result = await sequelize.query(
    `
    SELECT
      COUNT(*) as total_fields,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_fields,
      SUM(area_sqm) as total_area_sqm,
      AVG(area_sqm) as avg_field_size_sqm
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
    total: parseInt(metrics.total_fields, 10),
    active: parseInt(metrics.active_fields, 10),
    total_area_hectares: metrics.total_area_sqm ? Math.round(metrics.total_area_sqm / 10000 * 100) / 100 : 0,
    average_size_hectares: metrics.avg_field_size_sqm ? Math.round(metrics.avg_field_size_sqm / 10000 * 100) / 100 : 0
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
      hr.health_score,
      hr.health_status,
      hr.ndvi_mean,
      hr.ndwi_mean,
      hr.measurement_date,
      f.field_id,
      f.name as field_name
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
      total_assessed: 0
    };
  }

  const scores = healthRecords.map(r => r.health_score);
  const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // Count by status
  const statusCount = healthRecords.reduce((acc, record) => {
    const status = record.health_status;
    if (status === 'excellent' || status === 'good') {
      acc.good += 1;
    } else if (status === 'fair') {
      acc.moderate += 1;
    } else {
      acc.poor += 1;
    }
    return acc;
  }, { good: 0, moderate: 0, poor: 0 });

  return {
    average_score: averageScore,
    status_distribution: statusCount,
    total_assessed: healthRecords.length
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
      COUNT(*) as total_alerts,
      COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_severity,
      COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_severity,
      COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_severity,
      COUNT(CASE WHEN type = 'water' THEN 1 END) as water_alerts,
      COUNT(CASE WHEN type = 'fertilizer' THEN 1 END) as fertilizer_alerts
    FROM recommendations r
    INNER JOIN fields f ON r.field_id = f.field_id
    WHERE f.user_id = :userId AND f.status = 'active'
    AND r.timestamp >= :sevenDaysAgo
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: {
        userId,
        sevenDaysAgo: sevenDaysAgo.toISOString()
      },
    }
  );

  const metrics = alerts[0];
  return {
    total: parseInt(metrics.total_alerts, 10),
    by_severity: {
      high: parseInt(metrics.high_severity, 10),
      medium: parseInt(metrics.medium_severity, 10),
      low: parseInt(metrics.low_severity, 10)
    },
    by_type: {
      water: parseInt(metrics.water_alerts, 10),
      fertilizer: parseInt(metrics.fertilizer_alerts, 10)
    }
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
      'health_assessment' as activity_type,
      hr.measurement_date as activity_date,
      f.name as field_name,
      hr.health_status,
      hr.health_score
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
      'recommendation' as activity_type,
      r.timestamp as activity_date,
      f.name as field_name,
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
    .sort((a, b) => new Date(b.activity_date) - new Date(a.activity_date))
    .slice(0, 15);

  return allActivity.map(activity => ({
    type: activity.activity_type,
    date: activity.activity_date,
    field_name: activity.field_name,
    details: activity.activity_type === 'health_assessment'
      ? { status: activity.health_status, score: activity.health_score }
      : { type: activity.type, severity: activity.severity }
  }));
}

/**
 * Get field thumbnails (satellite image URLs)
 */
async function getFieldThumbnails(userId) {
  const satelliteService = getSatelliteService();

  // Get fields with their centers for thumbnail generation
  const fields = await sequelize.query(
    `
    SELECT
      f.field_id,
      f.name,
      ST_AsGeoJSON(f.center)::json as center,
      f.area_sqm
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
    fields.map(async (field) => {
      try {
        const center = field.center;
        if (!center || !center.coordinates) {
          return {
            field_id: field.field_id,
            field_name: field.name,
            thumbnail_url: null,
            area_hectares: Math.round(field.area_sqm / 10000 * 100) / 100
          };
        }

        // Generate a tile URL for the field center
        // Using zoom level 14 for field-level view
        const [lon, lat] = center.coordinates;
        const zoom = 14;

        // Convert lat/lon to tile coordinates
        const n = Math.pow(2, zoom);
        const x = Math.floor(((lon + 180) / 360) * n);
        const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);

        // Get today's date for recent imagery
        const today = new Date().toISOString().split('T')[0];

        // Generate tile URL (this would be the API endpoint for tiles)
        const thumbnail_url = `/api/v1/satellite/tiles/${zoom}/${x}/${y}?date=${today}&bands=RGB`;

        return {
          field_id: field.field_id,
          field_name: field.name,
          thumbnail_url,
          area_hectares: Math.round(field.area_sqm / 10000 * 100) / 100
        };
      } catch (error) {
        logger.warn('dashboard.thumbnail.error', {
          field_id: field.field_id,
          error: error.message
        });
        return {
          field_id: field.field_id,
          field_name: field.name,
          thumbnail_url: null,
          area_hectares: Math.round(field.area_sqm / 10000 * 100) / 100
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
      AVG(hr.ndvi_mean) as avg_ndvi,
      AVG(hr.ndwi_mean) as avg_ndwi,
      AVG(hr.tdvi_mean) as avg_tdvi,
      COUNT(*) as total_records
    FROM health_records hr
    INNER JOIN fields f ON hr.field_id = f.field_id
    WHERE f.user_id = :userId AND f.status = 'active'
    AND hr.measurement_date >= DATE('now', '-30 days')
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { userId },
    }
  );

  const metrics = result[0];
  return {
    ndvi: metrics.avg_ndvi ? Number(metrics.avg_ndvi.toFixed(3)) : null,
    ndwi: metrics.avg_ndwi ? Number(metrics.avg_ndwi.toFixed(3)) : null,
    tdvi: metrics.avg_tdvi ? Number(metrics.avg_tdvi.toFixed(3)) : null,
    total_records: parseInt(metrics.total_records, 10)
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
  const perfKey = 'api:performance:last_hour';
  const perfData = await redis.get(perfKey);
  let avgResponseTime = null;
  if (perfData) {
    try {
      const parsed = JSON.parse(perfData);
      avgResponseTime = parsed.avg_response_time_ms || null;
    } catch (e) {
      // ignore
    }
  }

  return {
    uptime_hours: uptimeHours,
    api_performance: {
      avg_response_time_ms: avgResponseTime
    }
  };
}

/**
 * Get weather forecast for user's first field
 */
async function getWeatherForecast(userId) {
  try {
    const { getWeatherService } = require('../../services/weather.service');
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

    const fieldId = fieldResult[0].field_id;
    const forecast = await weatherService.getForecast(userId, fieldId);

    return {
      forecast: forecast.data.days.slice(0, 7),
      totals: forecast.data.totals,
      available: true
    };
  } catch (error) {
    logger.warn('dashboard.weather_forecast.error', { error: error.message });
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
      COUNT(DISTINCT f.field_id) as total_fields,
      COUNT(hr.health_record_id) as total_assessments,
      AVG(hr.health_score) as avg_health_score,
      MAX(hr.created_at) as last_activity
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
    total_fields: parseInt(metrics.total_fields, 10),
    total_assessments: parseInt(metrics.total_assessments, 10),
    avg_health_score: metrics.avg_health_score ? Number(metrics.avg_health_score.toFixed(1)) : null,
    last_activity: metrics.last_activity,
    active_users_today: 1, // mock
    session_duration_avg: 15.5 // mock in minutes
  };
}

/**
 * Get disaster assessment (integrate with ML service)
 */
async function getDisasterAssessment(userId) {
  try {
    const { getMlGatewayService } = require('../../services/mlGateway.service');
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
      fieldsResult.map(async (field) => {
        try {
          const assessment = await mlService.getDisasterAssessment(field.field_id);
          return {
            field_id: field.field_id,
            field_name: field.name,
            risk_level: assessment.risk_level,
            disaster_types: assessment.disaster_types,
            confidence: assessment.confidence,
            assessed_at: assessment.assessed_at
          };
        } catch (error) {
          return {
            field_id: field.field_id,
            field_name: field.name,
            risk_level: 'unknown',
            disaster_types: [],
            confidence: 0,
            assessed_at: null
          };
        }
      })
    );

    return {
      assessments,
      available: true,
      high_risk_count: assessments.filter(a => a.risk_level === 'high').length
    };
  } catch (error) {
    logger.warn('dashboard.disaster_assessment.error', { error: error.message });
    return { assessments: [], available: false };
  }
}