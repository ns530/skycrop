const Sequelize = require('sequelize');
const { emitToField, emitToUser } = require('../websocket/server');

/**
 * Health Monitoring Service
 * Provides time-series analysis of field health data (NDVI, NDWI, TDVI)
 */

class HealthMonitoringService {
  constructor(healthModel, fieldModel) {
    this.HealthRecord = healthModel;
    this.Field = fieldModel;
  }

  /**
   * Analyze field health over time period
   * @param {string} field_id - Field UUID
   * @param {string} startDate - ISO date string (YYYY-MM-DD)
   * @param {string} endDate - ISO date string (YYYY-MM-DD)
   * @returns {Object} Health analysis with trends, scores, anomalies
   */
  async analyzeFieldHealth(field_id, startDate, endDate) {
    // 1. Validate dates
    this.validateDates(startDate, endDate);

    // 2. Verify field exists
    const field = await this.Field.findByPk(field_id);
    if (!field) {
      const error = new Error('Field not found');
      error.statusCode = 404;
      throw error;
    }

    // 3. Fetch health records from database (sorted by date ascending)
    const records = await this.HealthRecord.findAll({
      where: {
        field_id,
        measurementdate: {
          [Sequelize.Op.gte]: startDate,
          [Sequelize.Op.lte]: endDate,
        },
      },
      order: [['measurementdate', 'ASC']],
      raw: true,
    });

    // 4. If no records, return empty analysis
    if (!records || records.length === 0) {
      return {
        field_id,
        fieldName: field.name,
        period: { start: startDate, end: endDate },
        recordCount: 0,
        currentHealth: null,
        movingAverages: null,
        trend: { direction: 'nodata', slope: 0, r2: 0 },
        anomalies: [],
        healthScore: null,
        status: 'nodata',
      };
    }

    // 5. Calculate moving averages (7-day, 14-day, 30-day)
    const ma7 = this.calculateMovingAverage(records, 7, 'ndvimean');
    const ma14 = this.calculateMovingAverage(records, 14, 'ndvimean');
    const ma30 = this.calculateMovingAverage(records, 30, 'ndvimean');

    // 6. Detect trend (linear regression on NDVI)
    const timeSeries = records.map(r => ({
      date: r.measurementdate,
      value: r.ndvimean,
    }));
    const trend = this.detectTrend(timeSeries);

    // 7. Get latest record for current health
    const latestRecord = records[records.length - 1];

    // 8. Calculate overall health score
    const healthScore = this.calculateHealthScore(
      latestRecord.ndvimean,
      latestRecord.ndwimean,
      latestRecord.tdvimean
    );

    // 9. Detect anomalies (significant drops)
    const anomalies = this.detectAnomalies(records);

    // 10. Determine health status
    const status = this.getHealthStatus(healthScore);

    // 11. Build comprehensive analysis
    const analysis = {
      field_id,
      fieldName: field.name,
      period: {
        start: startDate,
        end: endDate,
      },
      recordCount: records.length,
      currentHealth: {
        date: latestRecord.measurementdate,
        score: healthScore,
        status,
        ndvi: latestRecord.ndvimean,
        ndwi: latestRecord.ndwimean,
        tdvi: latestRecord.tdvimean,
        cloudCover: latestRecord.cloudcover,
      },
      movingAverages: {
        ndvi_7day: ma7,
        ndvi_14day: ma14,
        ndvi_30day: ma30,
      },
      trend: {
        direction: trend.direction,
        slope: trend.slope,
        confidence: trend.r2,
        description: this.getTrendDescription(trend),
      },
      timeSeries: records.map(r => ({
        date: r.measurementdate,
        ndvi: r.ndvimean,
        ndwi: r.ndwimean,
        tdvi: r.tdvimean,
        healthScore: this.calculateHealthScore(r.ndvimean, r.ndwimean, r.tdvimean),
        cloudCover: r.cloudcover,
      })),
      anomalies,
      recommendations: this.generateQuickRecommendations(latestRecord, trend, anomalies),
    };

    // 12. Emit real-time update to WebSocket subscribers
    try {
      emitToField(field_id, 'healthupdated', {
        field_id,
        fieldName: field.name,
        health: {
          score: healthScore,
          status,
          date: latestRecord.measurementdate,
        },
        trend: trend.direction,
        anomalyCount: anomalies.length,
        timestamp: Date.now(),
      });

      // If critical status or anomalies, emit to field owner
      if (status === 'critical' || anomalies.length > 0) {
        emitToUser(field.user_id, 'healthalert', {
          field_id,
          fieldName: field.name,
          severity: status === 'critical' ? 'critical' : 'warning',
          message:
            status === 'critical'
              ? 'Field health is critical and requires immediate attention'
              : `${anomalies.length} health anomalies detected`,
          anomalies: anomalies.map(a => ({ date: a.date, severity: a.severity })),
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      // Don't fail the request if WebSocket emit fails
      console.error('Failed to emit health update:', error.message);
    }

    // 13. Return comprehensive analysis
    return analysis;
  }

  /**
   * Calculate moving average for a specific field
   * @private
   */
  calculateMovingAverage(records, window, field) {
    if (records.length < window) return null;

    const values = records.slice(-window).map(r => r[field]);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return parseFloat((sum / window).toFixed(4));
  }

  /**
   * Detect trend using simple linear regression
   * @private
   */
  detectTrend(timeSeries) {
    const n = timeSeries.length;
    if (n < 5) return { direction: 'insufficientdata', slope: 0, r2: 0 };

    // Convert to numeric data (index as x, value as y)
    const data = timeSeries.map((point, idx) => ({ x: idx, y: point.value }));

    // Calculate slope (m) and intercept (b) for y = mx + b
    const sumX = data.reduce((sum, p) => sum + p.x, 0);
    const sumY = data.reduce((sum, p) => sum + p.y, 0);
    const sumXY = data.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = data.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R² (coefficient of determination)
    const yMean = sumY / n;
    const ssTotal = data.reduce((sum, p) => sum + (p.y - yMean) ** 2, 0);
    const ssResidual = data.reduce((sum, p) => {
      const predicted = slope * p.x + intercept;
      return sum + (p.y - predicted) ** 2;
    }, 0);
    const r2 = 1 - ssResidual / ssTotal;

    // Determine direction based on slope threshold
    let direction = 'stable';
    if (slope > 0.01) direction = 'improving';
    else if (slope < -0.01) direction = 'declining';

    return {
      direction,
      slope: parseFloat(slope.toFixed(6)),
      r2: parseFloat(r2.toFixed(4)),
    };
  }

  /**
   * Detect anomalies (significant drops in NDVI)
   * @private
   */
  detectAnomalies(records) {
    const anomalies = [];

    // Check for week-over-week drops
    for (let i = 7; i < records.length; i++) {
      const current = records[i].ndvimean;
      const previous = records[i - 7].ndvimean;
      const percentChange = ((current - previous) / previous) * 100;

      if (percentChange < -15) {
        anomalies.push({
          date: records[i].measurementdate,
          type: 'ndvidrop',
          severity: percentChange < -25 ? 'critical' : 'high',
          description: `NDVI dropped ${Math.abs(percentChange).toFixed(1)}% in 7 days`,
          value: current,
          previousValue: previous,
          percentChange: parseFloat(percentChange.toFixed(2)),
        });
      }
    }

    return anomalies;
  }

  /**
   * Calculate overall health score (0-100)
   * @private
   */
  calculateHealthScore(ndvi, ndwi, tdvi) {
    // Weighted average: NDVI (60%), NDWI (30%), TDVI (10%)
    // Normalize indices to 0-1 range (they're typically -1 to 1)
    const ndviNorm = (ndvi + 1) / 2;
    const ndwiNorm = (ndwi + 1) / 2;
    const tdviNorm = (tdvi + 1) / 2;

    const score = ndviNorm * 60 + ndwiNorm * 30 + tdviNorm * 10;
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Get health status from score
   * @private
   */
  getHealthStatus(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  /**
   * Get human-readable trend description
   * @private
   */
  getTrendDescription(trend) {
    if (trend.direction === 'insufficientdata') {
      return 'Not enough data to determine trend';
    }
    if (trend.direction === 'improving') {
      return `Vegetation health is improving (slope: ${(trend.slope * 100).toFixed(2)}% per day)`;
    }
    if (trend.direction === 'declining') {
      return `Vegetation health is declining (slope: ${(trend.slope * 100).toFixed(2)}% per day)`;
    }
    return 'Vegetation health is stable';
  }

  /**
   * Generate quick recommendations based on health data
   * @private
   */
  generateQuickRecommendations(latestRecord, trend, anomalies) {
    const recommendations = [];

    // Critical NDVI drop
    if (latestRecord.ndvimean < 0.3) {
      recommendations.push({
        priority: 'critical',
        message: 'Very low vegetation vigor detected. Immediate attention required.',
        action: 'Check for pest damage, water stress, or nutrient deficiency',
      });
    }

    // Declining trend
    if (trend.direction === 'declining' && trend.slope < -0.02) {
      recommendations.push({
        priority: 'high',
        message: 'Health is declining rapidly.',
        action: 'Schedule field inspection and consider soil testing',
      });
    }

    // Low water content
    if (latestRecord.ndwimean < 0.1) {
      recommendations.push({
        priority: 'high',
        message: 'Low water content detected.',
        action: 'Check irrigation system and increase watering if needed',
      });
    }

    // Anomalies detected
    if (anomalies.length > 0) {
      const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
      if (criticalAnomalies.length > 0) {
        recommendations.push({
          priority: 'critical',
          message: `${criticalAnomalies.length} critical health drop(s) detected`,
          action: 'Investigate immediately for pest, disease, or environmental stress',
        });
      }
    }

    return recommendations;
  }

  /**
   * Validate date inputs
   * @private
   */
  validateDates(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(start.getTime())) {
      const error = new Error('Invalid start date format');
      error.statusCode = 400;
      throw error;
    }

    if (isNaN(end.getTime())) {
      const error = new Error('Invalid end date format');
      error.statusCode = 400;
      throw error;
    }

    if (start > end) {
      const error = new Error('Start date must be before end date');
      error.statusCode = 400;
      throw error;
    }

    if (end > now) {
      const error = new Error('End date cannot be in the future');
      error.statusCode = 400;
      throw error;
    }

    // Check if date range is reasonable (max 1 year)
    const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
      const error = new Error('Date range cannot exceed 365 days');
      error.statusCode = 400;
      throw error;
    }
  }
}

module.exports = HealthMonitoringService;
