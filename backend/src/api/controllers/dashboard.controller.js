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
      SUM(areasqm) as totalareasqm,
      AVG(areasqm) as avgfieldsizesqm
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
    total: parseInt(metrics.totalfields, 10),
    active: parseInt(metrics.activefields, 10),
    totalareahectares: metrics.totalareasqm
      ? Math.round((metrics.totalareasqm / 10000) * 100) / 100
      : 0,
    averagesizehectares: metrics.avgfieldsizesqm
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
      hr.healthscore,
      hr.healthstatus,
      hr.ndvimean,
      hr.ndwimean,
      hr.measurementdate,
      f.field_id,
      f.name as fieldname
    FROM healthrecords hr
    INNER JOIN fields f ON hr.field_id = f.field_id
    WHERE f.user_id = :userId AND f.status = 'active'
    AND hr.measurementdate = (
      SELECT MAX(hr2.measurementdate)
      FROM healthrecords hr2
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
      averagescore: 50,
      statusdistribution: { good: 0, moderate: 0, poor: 0 },
      totalassessed: 0,
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
    averagescore: averageScore,
    statusdistribution: statusCount,
    totalassessed: healthRecords.length,
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
    AND r.timestamp >= :sevenDaysAgo
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
    total: parseInt(metrics.totalalerts, 10),
    byseverity: {
      high: parseInt(metrics.highseverity, 10),
      medium: parseInt(metrics.mediumseverity, 10),
      low: parseInt(metrics.lowseverity, 10),
    },
    bytype: {
      water: parseInt(metrics.wateralerts, 10),
      fertilizer: parseInt(metrics.fertilizeralerts, 10),
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
      hr.measurementdate as activitydate,
      f.name as fieldname,
      hr.healthstatus,
      hr.healthscore
    FROM healthrecords hr
    INNER JOIN fields f ON hr.field_id = f.field_id
    WHERE f.user_id = :userId AND f.status = 'active'
    AND hr.createdat >= :sevenDaysAgo
    ORDER BY hr.createdat DESC
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
      r.timestamp as activitydate,
      f.name as fieldname,
      r.type,
      r.severity
    FROM recommendations r
    INNER JOIN fields f ON r.field_id = f.field_id
    WHERE f.user_id = :userId AND f.status = 'active'
    AND r.createdat >= :sevenDaysAgo
    ORDER BY r.createdat DESC
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
    type: activity.activitytype,
    date: activity.activitydate,
    fieldname: activity.fieldname,
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
      STAsGeoJSON(f.center)::json as center,
      f.areasqm
    FROM fields f
    WHERE f.user_id = :userId AND f.status = 'active'
    ORDER BY f.createdat DESC
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
            fieldId: field.field_id,
            fieldname: field.name,
            thumbnailurl: null,
            areahectares: Math.round((field.areasqm / 10000) * 100) / 100,
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
          fieldId: field.field_id,
          fieldname: field.name,
          thumbnailurl,
          areahectares: Math.round((field.areasqm / 10000) * 100) / 100,
        };
      } catch (error) {
        logger.warn('dashboard.thumbnail.error', {
          fieldId: field.field_id,
          error: error.message,
        });
        return {
          fieldId: field.field_id,
          fieldname: field.name,
          thumbnailurl: null,
          areahectares: Math.round((field.areasqm / 10000) * 100) / 100,
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
      AVG(hr.ndvimean) as avgndvi,
      AVG(hr.ndwimean) as avgndwi,
      AVG(hr.tdvimean) as avgtdvi,
      COUNT(*) as totalrecords
    FROM healthrecords hr
    INNER JOIN fields f ON hr.field_id = f.field_id
    WHERE f.user_id = :userId AND f.status = 'active'
    AND hr.measurementdate >= DATE('now', '-30 days')
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { userId },
    }
  );

  const metrics = result[0];
  return {
    ndvi: metrics.avgndvi ? Number(metrics.avgndvi.toFixed(3)) : null,
    ndwi: metrics.avgndwi ? Number(metrics.avgndwi.toFixed(3)) : null,
    tdvi: metrics.avgtdvi ? Number(metrics.avgtdvi.toFixed(3)) : null,
    totalrecords: parseInt(metrics.totalrecords, 10),
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
  const perfKey = 'api:performance:lasthour';
  const perfData = await redis.get(perfKey);
  let avgResponseTime = null;
  if (perfData) {
    try {
      const parsed = JSON.parse(perfData);
      avgResponseTime = parsed.avgresponsetimems || null;
    } catch (e) {
      // ignore
    }
  }

  return {
    uptimehours: uptimeHours,
    apiperformance: {
      avgresponsetimems: avgResponseTime,
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
      ORDER BY createdat ASC
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
      COUNT(hr.healthrecordid) as totalassessments,
      AVG(hr.healthscore) as avghealthscore,
      MAX(hr.createdat) as lastactivity
    FROM fields f
    LEFT JOIN healthrecords hr ON f.field_id = hr.field_id
    WHERE f.user_id = :userId AND f.status = 'active'
    `,
    {
      type: sequelize.QueryTypes.SELECT,
      replacements: { userId },
    }
  );

  const metrics = result[0];
  return {
    totalfields: parseInt(metrics.totalfields, 10),
    totalassessments: parseInt(metrics.totalassessments, 10),
    avghealthscore: metrics.avghealthscore ? Number(metrics.avghealthscore.toFixed(1)) : null,
    lastactivity: metrics.lastactivity,
    activeuserstoday: 1, // mock
    sessiondurationavg: 15.5, // mock in minutes
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
            fieldId: field.field_id,
            fieldname: field.name,
            risklevel: assessment.risklevel,
            disastertypes: assessment.disastertypes,
            confidence: assessment.confidence,
            assessedat: assessment.assessedat,
          };
        } catch (error) {
          return {
            fieldId: field.field_id,
            fieldname: field.name,
            risklevel: 'unknown',
            disastertypes: [],
            confidence: 0,
            assessedat: null,
          };
        }
      })
    );

    return {
      assessments,
      available: true,
      highriskcount: assessments.filter(a => a.risklevel === 'high').length,
    };
  } catch (error) {
    logger.warn('dashboard.disasterassessment.error', { error: error.message });
    return { assessments: [], available: false };
  }
}

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
    disasterAssessment,
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
    getDisasterAssessment(userId),
  ]);

  return {
    fields: fieldMetrics,
    health: healthMetrics,
    alerts: alertMetrics,
    recentactivity: recentActivity,
    fieldthumbnails: fieldThumbnails,
    vegetationindices: vegetationIndices,
    system: systemMetrics,
    weatherforecast: weatherForecast,
    useranalytics: userAnalytics,
    disasterassessment: disasterAssessment,
    generatedat: new Date().toISOString(),
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

      // Aggregate metrics
      const metrics = await aggregateDashboardMetrics(userId);

      // Cache the result
      await redis.setEx(cacheKey, DASHBOARDCACHETTLSEC, JSON.stringify(metrics));

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

