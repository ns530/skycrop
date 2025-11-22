/**
 * Recommendations Job
 * 
 * Scheduled job to generate farming recommendations for all active fields
 * Runs every 7 days (adjustable)
 */

const logger = require('../config/logger.config');
const { Field } = require('../models');
const recommendationService = require('../services/recommendation.service');
const healthService = require('../services/fieldHealth.service');
const weatherService = require('../services/weather.service');

/**
 * Generate recommendations for all active fields
 */
async function runRecommendationsGeneration() {
  logger.info('Starting recommendations generation job...');

  try {
    // Get all active fields
    const fields = await Field.findAll({
      where: {
        status: 'active',
      },
      attributes: ['field_id', 'user_id', 'name', 'center'],
    });

    logger.info(`Found ${fields.length} active fields for recommendations`);

    if (fields.length === 0) {
      logger.info('No active fields to process');
      return;
    }

    const results = {
      total: fields.length,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    // Process each field
    for (const field of fields) {
      try {
        logger.debug(`Generating recommendations for field: ${field.name} (${field.field_id})`);

        // Check if we have recent recommendations (within last 6 days)
        const recentRecommendations = await recommendationService.getRecentRecommendations(
          field.field_id,
          6 // days
        );

        if (recentRecommendations && recentRecommendations.length > 0) {
          logger.debug(`Field ${field.name} has recent recommendations, skipping`);
          results.skipped++;
          continue;
        }

        // Get latest health data
        const latestHealth = await healthService.getLatestHealthRecord(field.field_id);
        if (!latestHealth) {
          logger.warn(`No health data available for field ${field.name}, skipping`);
          results.skipped++;
          continue;
        }

        // Get weather forecast
        const center = JSON.parse(field.center);
        const latitude = center.coordinates[1];
        const longitude = center.coordinates[0];

        const weatherForecast = await weatherService.getForecast({
          latitude,
          longitude,
        });

        // Generate recommendations based on health and weather data
        const recommendations = await recommendationService.generateRecommendations({
          fieldId: field.field_id,
          userId: field.user_id,
          healthData: latestHealth,
          weatherData: weatherForecast,
        });

        // Save recommendations
        if (recommendations && recommendations.length > 0) {
          await recommendationService.saveRecommendations(field.field_id, recommendations);
          logger.info(`Generated ${recommendations.length} recommendations for field: ${field.name}`);
          results.success++;
        } else {
          logger.warn(`No recommendations generated for field: ${field.name}`);
          results.skipped++;
        }

        // Add delay to avoid overwhelming services
        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (error) {
        logger.error(`Error generating recommendations for field ${field.field_id}:`, error);
        results.failed++;
        results.errors.push({
          fieldId: field.field_id,
          fieldName: field.name,
          error: error.message,
        });
        continue;
      }
    }

    // Log summary
    logger.info('Recommendations generation job completed', {
      total: results.total,
      success: results.success,
      failed: results.failed,
      skipped: results.skipped,
      successRate: `${((results.success / results.total) * 100).toFixed(1)}%`,
    });

    if (results.errors.length > 0) {
      logger.warn('Recommendations generation errors:', {
        count: results.errors.length,
        errors: results.errors.slice(0, 5),
      });
    }

    return results;

  } catch (error) {
    logger.error('Fatal error in recommendations generation job:', error);
    throw error;
  }
}

module.exports = {
  runRecommendationsGeneration,
  schedule: '0 7 */7 * *', // Every 7 days at 7:00 AM
  description: 'Generate farming recommendations for all active fields',
  enabled: true,
  critical: false,
};

