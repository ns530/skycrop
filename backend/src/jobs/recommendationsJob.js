/**
 * Recommendations Job
 *
 * Scheduled job to generate farming recommendations for all active fields
 * Runs every 7 days (adjustable)
 */

import logger from '../config/logger.config';
import { Field } from '../models/index';
import recommendationService from '../services/recommendation.service';
import healthService from '../services/fieldHealth.service';
import weatherService from '../services/weather.service';

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

    // Process fields in parallel with rate limiting
    const BATCHSIZE = 3; // Process 3 fields concurrently (lighter than health monitoring)
    const DELAYBETWEENBATCHES = 2000; // 2 seconds between batches

    for (let i = 0; i < fields.length; i += BATCHSIZE) {
      const batch = fields.slice(i, i + BATCHSIZE);
      logger.debug(
        `Processing batch ${Math.floor(i / BATCHSIZE) + 1}/${Math.ceil(fields.length / BATCHSIZE)} (${batch.length} fields)`
      );

      // Process batch in parallel
      const batchPromises = batch.map(async field => {
        try {
          logger.debug(`Generating recommendations for field: ${field.name} (${field.field_id})`);

          // Check if we have recent recommendations (within last 6 days)
          const recentRecommendations = await recommendationService.getRecentRecommendations(
            field.field_id,
            6 // days
          );

          if (recentRecommendations && recentRecommendations.length > 0) {
            logger.debug(`Field ${field.name} has recent recommendations, skipping`);
            return { status: 'skipped', field };
          }

          // Get latest health data
          const latestHealth = await healthService.getLatestHealthRecord(field.field_id);
          if (!latestHealth) {
            logger.warn(`No health data available for field ${field.name}, skipping`);
            return { status: 'skipped', field };
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
            field_id: field.field_id,
            user_id: field.user_id,
            healthData: latestHealth,
            weatherData: weatherForecast,
          });

          // Save recommendations
          if (recommendations && recommendations.length > 0) {
            await recommendationService.saveRecommendations(field.field_id, recommendations);
            logger.info(
              `Generated ${recommendations.length} recommendations for field: ${field.name}`
            );
            return { status: 'success', field, count: recommendations.length };
          }
          logger.warn(`No recommendations generated for field: ${field.name}`);
          return { status: 'skipped', field };
        } catch (error) {
          logger.error(`Error generating recommendations for field ${field.field_id}:`, error);
          return {
            status: 'failed',
            field,
            error: error.message,
          };
        }
      });

      // Wait for all promises in the batch to complete
      const batchResults = await Promise.all(batchPromises);

      // Update results
      for (const result of batchResults) {
        if (result.status === 'success') {
          results.success += 1;
        } else if (result.status === 'skipped') {
          results.skipped += 1;
        } else if (result.status === 'failed') {
          results.failed += 1;
          results.errors.push({
            field_id: result.field.field_id,
            fieldName: result.field.name,
            error: result.error,
          });
        }
      }

      // Rate limiting delay between batches (except for the last batch)
      if (i + BATCHSIZE < fields.length) {
        await new Promise(resolve => setTimeout(resolve, DELAYBETWEENBATCHES));
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

export default {
  runRecommendationsGeneration,
  schedule: '0 7 */7 * *', // Every 7 days at 7:00 AM
  description: 'Generate farming recommendations for all active fields',
  enabled: true,
  critical: false,
};
