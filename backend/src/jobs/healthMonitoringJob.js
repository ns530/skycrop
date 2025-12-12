/**
 * Health Monitoring Job
 *
 * Scheduled job to update crop health data for all active fields
 * Runs daily at 6:00 AM (adjustable)
 */

import logger from '../config/logger.config';
import Field from '../models/field.model';
import satelliteService from '../services/satellite.service';
import healthService from '../services/fieldHealth.service';

/**
 * Process health monitoring for all active fields
 */
async function runHealthMonitoring() {
  logger.info('Starting health monitoring job...');

  try {
    // Get all active fields
    const fields = await Field.findAll({
      where: {
        status: 'active',
      },
      attributes: ['field_id', 'user_id', 'name', 'boundary', 'center', 'areasqm'],
    });

    logger.info(`Found ${fields.length} active fields for health monitoring`);

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
    const BATCHSIZE = 5; // Process 5 fields concurrently
    const DELAYBETWEENBATCHES = 1000; // 1 second between batches

    for (let i = 0; i < fields.length; i += BATCHSIZE) {
      const batch = fields.slice(i, i + BATCHSIZE);
      logger.debug(
        `Processing batch ${Math.floor(i / BATCHSIZE) + 1}/${Math.ceil(fields.length / BATCHSIZE)} (${batch.length} fields)`
      );

      // Process batch in parallel
      const batchPromises = batch.map(async field => {
        try {
          logger.debug(`Processing health for field: ${field.name} (${field.field_id})`);

          // Check if we already have recent health data (within last 24 hours)
          const latestHealth = await healthService.getLatestHealthRecord(field.field_id);
          if (latestHealth) {
            const hoursSinceLastUpdate =
              (Date.now() - new Date(latestHealth.measurementdate).getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastUpdate < 23) {
              logger.debug(
                `Field ${field.name} has recent health data (${hoursSinceLastUpdate.toFixed(1)}h ago), skipping`
              );
              return { status: 'skipped', field };
            }
          }

          // Get the field center coordinates
          const center = JSON.parse(field.center);
          const latitude = center.coordinates[1];
          const longitude = center.coordinates[0];

          // Fetch satellite imagery for health indices
          const date = new Date().toISOString().split('T')[0]; // Today's date
          const cloudCover = 20; // Max cloud cover percentage

          // Request satellite data
          const satelliteData = await satelliteService.getSatelliteImagery({
            latitude,
            longitude,
            date,
            cloudCover,
          });

          // Calculate health indices (NDVI, NDWI, TDVI)
          const healthData = await healthService.calculateHealthIndices({
            field_id: field.field_id,
            satelliteData,
            measurementDate: date,
          });

          // Save health record
          await healthService.createHealthRecord(healthData);

          logger.info(`Successfully updated health for field: ${field.name}`);
          return { status: 'success', field };
        } catch (error) {
          logger.error(`Error processing health for field ${field.field_id}:`, error);
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
      for (let j = 0; j < batchResults.length; j += 1) {
        const result = batchResults[j];
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
    logger.info('Health monitoring job completed', {
      total: results.total,
      success: results.success,
      failed: results.failed,
      skipped: results.skipped,
      successRate: `${((results.success / results.total) * 100).toFixed(1)}%`,
    });

    if (results.errors.length > 0) {
      logger.warn('Health monitoring errors:', {
        count: results.errors.length,
        errors: results.errors.slice(0, 5), // Log first 5 errors
      });
    }

    return results;
  } catch (error) {
    logger.error('Fatal error in health monitoring job:', error);
    throw error;
  }
}

export default {
  runHealthMonitoring,
  schedule: '0 6 * * *', // Daily at 6:00 AM
  description: 'Update crop health data for all active fields',
  enabled: true,
  critical: true,
};
