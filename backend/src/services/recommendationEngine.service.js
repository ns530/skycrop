'use strict';

const { emitToField, emitToUser } = require('../websocket/server');

/**
 * Recommendation Engine Service
 * Generates intelligent farming recommendations based on:
 * - Field health data (NDVI, NDWI, TDVI)
 * - Weather conditions (rainfall, humidity, temperature)
 * - Field history and trends
 */

class RecommendationEngineService {
  constructor(healthMonitoringService, weatherService, fieldModel, recommendationModel) {
    this.healthMonitoringService = healthMonitoringService;
    this.weatherService = weatherService;
    this.Field = fieldModel;
    this.Recommendation = recommendationModel;
  }

  /**
   * Generate recommendations for a field
   * @param {string} fieldId - Field UUID
   * @param {string} userId - User UUID (for verification)
   * @returns {Object} Generated recommendations with priorities
   */
  async generateRecommendations(fieldId, userId) {
    // 1. Verify field exists and user owns it
    const field = await this.Field.findByPk(fieldId);
    if (!field) {
      const error = new Error('Field not found');
      error.statusCode = 404;
      throw error;
    }

    if (field.user_id !== userId) {
      const error = new Error('Unauthorized access to field');
      error.statusCode = 403;
      throw error;
    }

    // 2. Get field health analysis (last 30 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const startDateStr = startDate.toISOString().split('T')[0];

    const health = await this.healthMonitoringService.analyzeFieldHealth(
      fieldId,
      startDateStr,
      endDate
    );

    // 3. Get weather forecast (next 7 days)
    let weatherData = null;
    try {
      const lat = field.center.coordinates[1]; // latitude
      const lon = field.center.coordinates[0]; // longitude
      const weatherResponse = await this.weatherService.getForecastByCoords(lat, lon);
      weatherData = this._normalizeWeatherData(weatherResponse.data);
    } catch (error) {
      // Weather service unavailable - continue without weather data
      weatherData = null;
    }
    const weather = weatherData;

    // 4. Apply recommendation rules
    const recommendations = [];

    // Rule 1: Fertilizer Recommendation
    const fertilizerRec = this._evaluateFertilizerNeed(health);
    if (fertilizerRec) recommendations.push(fertilizerRec);

    // Rule 2: Irrigation Recommendation
    const irrigationRec = this._evaluateIrrigationNeed(health, weather);
    if (irrigationRec) recommendations.push(irrigationRec);

    // Rule 3: Pest/Disease Alert
    const pestRec = this._evaluatePestDiseaseRisk(health, weather);
    if (pestRec) recommendations.push(pestRec);

    // Rule 4: General Health Improvement
    const generalRec = this._evaluateGeneralHealth(health);
    if (generalRec) recommendations.push(generalRec);

    // Rule 5: Water Stress Alert
    const waterStressRec = this._evaluateWaterStress(health);
    if (waterStressRec) recommendations.push(waterStressRec);

    // 5. Sort by urgency (highest first)
    recommendations.sort((a, b) => b.urgency - a.urgency);

    // 6. Save recommendations to database
    const savedRecommendations = await this._saveRecommendations(
      fieldId,
      userId,
      recommendations
    );

    // 7. Build response
    const response = {
      fieldId,
      fieldName: field.name,
      generatedAt: new Date().toISOString(),
      healthSummary: {
        currentScore: health.currentHealth?.score || null,
        status: health.currentHealth?.status || 'no_data',
        trend: health.trend?.direction || 'unknown',
      },
      recommendations: savedRecommendations,
      totalCount: savedRecommendations.length,
      criticalCount: savedRecommendations.filter((r) => r.priority === 'critical').length,
      highCount: savedRecommendations.filter((r) => r.priority === 'high').length,
    };

    // 8. Emit real-time update to WebSocket subscribers
    try {
      const criticalRecs = savedRecommendations.filter((r) => r.priority === 'critical');
      const highRecs = savedRecommendations.filter((r) => r.priority === 'high');

      emitToField(fieldId, 'recommendations_updated', {
        fieldId,
        fieldName: field.name,
        totalCount: savedRecommendations.length,
        criticalCount: criticalRecs.length,
        highCount: highRecs.length,
        timestamp: Date.now(),
      });

      // If critical or high priority recommendations exist, notify user
      if (criticalRecs.length > 0 || highRecs.length > 0) {
        emitToUser(userId, 'recommendation_created', {
          fieldId,
          fieldName: field.name,
          message: criticalRecs.length > 0
            ? `${criticalRecs.length} critical recommendation(s) require immediate action`
            : `${highRecs.length} high priority recommendation(s) generated`,
          recommendations: [...criticalRecs, ...highRecs.slice(0, 3)].map(r => ({
            id: r.recommendation_id,
            type: r.type,
            priority: r.priority,
            title: r.title,
          })),
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      // Don't fail the request if WebSocket emit fails
      console.error('Failed to emit recommendation update:', error.message);
    }

    // 9. Return recommendations with metadata
    return response;
  }

  /**
   * Rule 1: Evaluate fertilizer need based on NDVI
   * @private
   */
  _evaluateFertilizerNeed(health) {
    if (!health.currentHealth) return null;

    const { ndvi } = health.currentHealth;
    const { direction } = health.trend;

    // Low NDVI + declining trend = Nitrogen deficiency
    if (ndvi < 0.5 && direction === 'declining') {
      return {
        type: 'fertilizer',
        priority: 'high',
        urgency: 85,
        title: 'Apply nitrogen fertilizer',
        description: `NDVI is ${ndvi.toFixed(2)} and declining. This indicates low vegetation vigor, likely due to nitrogen deficiency.`,
        reason: 'Low vegetation vigor indicates nitrogen deficiency',
        actionSteps: [
          'Purchase urea fertilizer (40-50 kg per hectare)',
          'Apply during dry weather conditions',
          'Water lightly after application to help absorption',
          'Monitor NDVI improvement over next 2 weeks',
        ],
        estimatedCost: 2500, // LKR
        expectedBenefit: '+15% yield increase',
        timing: 'Within 3 days',
        validUntil: this._addDays(new Date(), 7),
      };
    }

    // Moderate NDVI but declining
    if (ndvi >= 0.5 && ndvi < 0.65 && direction === 'declining') {
      return {
        type: 'fertilizer',
        priority: 'medium',
        urgency: 60,
        title: 'Consider preventive fertilization',
        description: `NDVI is ${ndvi.toFixed(2)} and showing declining trend. Consider preventive fertilization to maintain vigor.`,
        reason: 'Declining vegetation health - preventive measure',
        actionSteps: [
          'Assess soil nutrient levels',
          'Apply balanced NPK fertilizer (20-30 kg per hectare)',
          'Monitor vegetation response',
        ],
        estimatedCost: 1800,
        expectedBenefit: '+8% yield increase',
        timing: 'Within 7 days',
        validUntil: this._addDays(new Date(), 14),
      };
    }

    return null;
  }

  /**
   * Rule 2: Evaluate irrigation need based on NDWI and rainfall
   * @private
   */
  _evaluateIrrigationNeed(health, weather) {
    if (!health.currentHealth || !weather || weather.length === 0) return null;

    const { ndwi } = health.currentHealth;
    
    // Calculate expected rainfall in next 7 days
    const rainfallNext7Days = weather
      .slice(0, 7)
      .reduce((sum, day) => sum + (day.rainfall_amount || 0), 0);

    // Critical: Low water content + no rain expected
    if (ndwi < 0.2 && rainfallNext7Days < 10) {
      return {
        type: 'irrigation',
        priority: 'critical',
        urgency: 95,
        title: 'Immediate irrigation required',
        description: `NDWI is ${ndwi.toFixed(2)} indicating low water content. Only ${rainfallNext7Days.toFixed(1)}mm rain expected in next 7 days. Water stress detected.`,
        reason: 'Severe water stress - immediate action needed',
        actionSteps: [
          'Irrigate immediately (50-75mm water depth)',
          'Focus on morning irrigation to reduce evaporation',
          'Check irrigation system for proper coverage',
          'Monitor soil moisture daily',
        ],
        estimatedCost: 1500,
        expectedBenefit: 'Prevent crop stress and yield loss',
        timing: 'Immediate (today)',
        validUntil: this._addDays(new Date(), 2),
      };
    }

    // Moderate: Low water content but some rain expected
    if (ndwi < 0.3 && rainfallNext7Days < 20) {
      return {
        type: 'irrigation',
        priority: 'high',
        urgency: 75,
        title: 'Schedule irrigation soon',
        description: `NDWI is ${ndwi.toFixed(2)}. Limited rainfall (${rainfallNext7Days.toFixed(1)}mm) expected. Plan irrigation within 2-3 days.`,
        reason: 'Moderate water stress with insufficient rainfall forecast',
        actionSteps: [
          'Schedule irrigation within 2-3 days',
          'Apply 30-50mm water depth',
          'Monitor weather updates for rainfall changes',
        ],
        estimatedCost: 1200,
        expectedBenefit: 'Maintain optimal growth conditions',
        timing: 'Within 2-3 days',
        validUntil: this._addDays(new Date(), 5),
      };
    }

    return null;
  }

  /**
   * Rule 3: Evaluate pest/disease risk based on weather conditions
   * @private
   */
  _evaluatePestDiseaseRisk(health, weather) {
    if (!weather || weather.length === 0) return null;

    // Check for high humidity days (>80%)
    const highHumidityDays = weather
      .slice(0, 7)
      .filter((d) => d.humidity > 80).length;

    // Calculate average temperature
    const avgTemp = weather
      .slice(0, 7)
      .reduce((sum, d) => sum + (d.temp_max + d.temp_min) / 2, 0) / Math.min(weather.length, 7);

    // High risk: High humidity + high temperature = Blast disease risk
    if (highHumidityDays >= 3 && avgTemp > 28) {
      return {
        type: 'pest_control',
        priority: 'high',
        urgency: 80,
        title: 'High risk of blast disease',
        description: `Weather conditions favorable for blast disease: ${highHumidityDays} days with humidity >80% and average temperature ${avgTemp.toFixed(1)}°C.`,
        reason: 'Favorable conditions for fungal diseases (rice blast)',
        actionSteps: [
          'Scout fields daily for early symptoms (diamond-shaped lesions)',
          'Apply preventive fungicide (Tricyclazole 75% WP)',
          'Ensure good air circulation in the field',
          'Avoid excessive nitrogen fertilization',
          'Remove infected plants if spotted',
        ],
        estimatedCost: 3000,
        expectedBenefit: 'Prevent potential 20-40% yield loss',
        timing: 'Within 1-2 days',
        validUntil: this._addDays(new Date(), 10),
      };
    }

    // Moderate risk: Extended high humidity
    if (highHumidityDays >= 4) {
      return {
        type: 'pest_control',
        priority: 'medium',
        urgency: 65,
        title: 'Monitor for fungal diseases',
        description: `Extended high humidity (${highHumidityDays} days) increases disease risk. Increase field monitoring.`,
        reason: 'Prolonged humidity favors fungal growth',
        actionSteps: [
          'Increase field scouting frequency',
          'Check for early disease symptoms',
          'Prepare fungicide for quick response',
          'Ensure proper drainage',
        ],
        estimatedCost: 500,
        expectedBenefit: 'Early disease detection and prevention',
        timing: 'Within 3-5 days',
        validUntil: this._addDays(new Date(), 7),
      };
    }

    return null;
  }

  /**
   * Rule 4: Evaluate general health status
   * @private
   */
  _evaluateGeneralHealth(health) {
    if (!health.currentHealth) return null;

    const { score, status } = health.currentHealth;

    // Poor health = Field inspection needed
    if (status === 'poor' || score < 40) {
      return {
        type: 'field_inspection',
        priority: 'high',
        urgency: 70,
        title: 'Schedule comprehensive field inspection',
        description: `Health score is ${score} (${status}). Multiple factors may be affecting crop health.`,
        reason: 'Poor overall health requires investigation',
        actionSteps: [
          'Conduct detailed field walk to identify issues',
          'Check for pest damage, disease symptoms, nutrient deficiencies',
          'Test soil pH and nutrient levels',
          'Assess irrigation system effectiveness',
          'Consider consulting agricultural extension officer',
        ],
        estimatedCost: 1000,
        expectedBenefit: 'Identify and address root causes',
        timing: 'Within 2 days',
        validUntil: this._addDays(new Date(), 5),
      };
    }

    // Fair health with anomalies = Monitor closely
    if (status === 'fair' && health.anomalies && health.anomalies.length > 0) {
      return {
        type: 'monitoring',
        priority: 'medium',
        urgency: 55,
        title: 'Increase field monitoring',
        description: `Health is fair but ${health.anomalies.length} anomaly(ies) detected. Monitor closely for further changes.`,
        reason: 'Recent health drops detected - monitor for deterioration',
        actionSteps: [
          'Visit field every 2-3 days',
          'Track vegetation changes',
          'Monitor for stress symptoms (wilting, yellowing)',
          'Be prepared for quick intervention',
        ],
        estimatedCost: 0,
        expectedBenefit: 'Early problem detection',
        timing: 'Ongoing',
        validUntil: this._addDays(new Date(), 14),
      };
    }

    return null;
  }

  /**
   * Rule 5: Evaluate water stress from NDVI/NDWI combination
   * @private
   */
  _evaluateWaterStress(health) {
    if (!health.currentHealth) return null;

    const { ndvi, ndwi } = health.currentHealth;

    // Combined indicator: Moderate NDVI but low NDWI = Water stress
    if (ndvi >= 0.5 && ndvi < 0.65 && ndwi < 0.25) {
      return {
        type: 'water_management',
        priority: 'high',
        urgency: 78,
        title: 'Water stress detected despite green vegetation',
        description: `NDVI ${ndvi.toFixed(2)} shows vegetation, but NDWI ${ndwi.toFixed(2)} indicates water stress. Plants may be under hidden stress.`,
        reason: 'Low water content despite visible vegetation',
        actionSteps: [
          'Check soil moisture at root depth (15-20cm)',
          'Increase irrigation frequency but reduce volume per session',
          'Mulch to reduce evaporation',
          'Check for irrigation system issues',
        ],
        estimatedCost: 800,
        expectedBenefit: 'Prevent yield loss from hidden water stress',
        timing: 'Within 2 days',
        validUntil: this._addDays(new Date(), 5),
      };
    }

    return null;
  }

  /**
   * Save recommendations to database
   * @private
   */
  async _saveRecommendations(fieldId, userId, recommendations) {
    const savedRecs = [];

    for (const rec of recommendations) {
      const saved = await this.Recommendation.create({
        field_id: fieldId,
        user_id: userId,
        type: rec.type,
        priority: rec.priority,
        title: rec.title,
        description: rec.description,
        reason: rec.reason,
        action_steps: JSON.stringify(rec.actionSteps),
        estimated_cost: rec.estimatedCost,
        expected_benefit: rec.expectedBenefit,
        timing: rec.timing,
        urgency_score: rec.urgency,
        valid_until: rec.validUntil,
        status: 'pending',
        generated_at: new Date(),
      });

      savedRecs.push({
        recommendationId: saved.recommendation_id,
        type: saved.type,
        priority: saved.priority,
        urgency: saved.urgency_score,
        title: saved.title,
        description: saved.description,
        reason: saved.reason,
        actionSteps: JSON.parse(saved.action_steps),
        estimatedCost: saved.estimated_cost,
        expectedBenefit: saved.expected_benefit,
        timing: saved.timing,
        validUntil: saved.valid_until,
        status: saved.status,
        generatedAt: saved.generated_at,
      });
    }

    return savedRecs;
  }

  /**
   * Helper: Add days to date
   * @private
   */
  _addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Normalize weather data from weather service to expected format
   * @private
   */
  _normalizeWeatherData(weatherResponse) {
    if (!weatherResponse || !weatherResponse.days || !Array.isArray(weatherResponse.days)) {
      return null;
    }

    // Transform weather service format to recommendation engine format
    return weatherResponse.days.map((day) => ({
      date: day.date,
      rainfall_amount: day.rain_mm || 0,
      humidity: day.humidity || 70, // Default if not provided
      temp_max: day.tmax || 30,
      temp_min: day.tmin || 22,
      wind_speed: day.wind || 0,
    }));
  }
}

module.exports = RecommendationEngineService;

