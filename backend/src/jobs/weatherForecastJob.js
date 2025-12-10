/**
 * Weather Forecast Job
 *
 * Scheduled job to update weather forecasts for all active field locations
 * Runs every 6 hours
 */

import logger from '../config/logger.config.js';
import { Field } from '../models/index.js';
import weatherService from '../services/weather.service.js';

/**
 * Update weather forecasts for all active fields
 */
async function runWeatherForecastUpdate() {
  logger.info('Starting weather forecast update job...');

  try {
    // Get all active fields with unique locations (group by coordinates)
    const fields = await Field.findAll({
      where: {
        status: 'active',
      },
      attributes: ['field_id', 'name', 'center'],
    });

    logger.info(`Found ${fields.length} active fields for weather forecast`);

    if (fields.length === 0) {
      logger.info('No active fields to process');
      return;
    }

    // Group fields by location to avoid duplicate API calls
    const locationGroups = new Map();
    
    for (const field of fields) {
      const center = JSON.parse(field.center);
      const latitude = center.coordinates[1].toFixed(2); // Round to 2 decimals
      const longitude = center.coordinates[0].toFixed(2);
      const locationKey = `${latitude},${longitude}`;

      if (!locationGroups.has(locationKey)) {
        locationGroups.set(locationKey, {
          latitude: center.coordinates[1],
          longitude: center.coordinates[0],
          fields: [],
        });
      }

      locationGroups.get(locationKey).fields.push({
        fieldId: field.field_id,
        name: field.name,
      });
    }

    logger.info(`Grouped ${fields.length} fields into ${locationGroups.size} unique locations`);

    const results = {
      totalLocations: locationGroups.size,
      totalFields: fields.length,
      success: 0,
      failed: 0,
      fieldsUpdated: 0,
      errors: [],
    };

    // Fetch weather for each unique location
    for (const [locationKey, locationData] of locationGroups.entries()) {
      try {
        logger.debug(`Fetching weather for location: ${locationKey} (${locationData.fields.length} fields)`);

        // Fetch weather forecast
        const forecast = await weatherService.getForecast({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });

        // Check for weather alerts
        const alerts = await weatherService.getWeatherAlerts({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });

        // Cache weather data for all fields at this location
        for (const fieldInfo of locationData.fields) {
          try {
            await weatherService.cacheWeatherData(fieldInfo.fieldId, {
              forecast,
              alerts,
              cachedAt: new Date(),
            });
            results.fieldsUpdated++;
          } catch (cacheError) {
            logger.error(`Error caching weather for field ${fieldInfo.fieldId}:`, cacheError);
          }
        }

        results.success++;
        logger.info(`Successfully updated weather for ${locationData.fields.length} fields at ${locationKey}`);

        // Check for severe weather alerts and send notifications
        if (alerts && alerts.length > 0) {
          for (const alert of alerts) {
            if (alert.severity === 'severe' || alert.severity === 'extreme') {
              logger.warn(`Severe weather alert for ${locationKey}:`, {
                event: alert.event,
                severity: alert.severity,
                description: alert.description,
              });

              // TODO: Send push notifications to affected users
              // await notificationService.sendWeatherAlert(locationData.fields, alert);
            }
          }
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        logger.error(`Error fetching weather for location ${locationKey}:`, error);
        results.failed++;
        results.errors.push({
          location: locationKey,
          fieldsCount: locationData.fields.length,
          error: error.message,
        });
        continue;
      }
    }

    // Log summary
    logger.info('Weather forecast update job completed', {
      totalLocations: results.totalLocations,
      totalFields: results.totalFields,
      locationsSuccessful: results.success,
      locationsFailed: results.failed,
      fieldsUpdated: results.fieldsUpdated,
      successRate: `${((results.success / results.totalLocations) * 100).toFixed(1)}%`,
    });

    if (results.errors.length > 0) {
      logger.warn('Weather forecast update errors:', {
        count: results.errors.length,
        errors: results.errors.slice(0, 5),
      });
    }

    return results;

  } catch (error) {
    logger.error('Fatal error in weather forecast update job:', error);
    throw error;
  }
}

export default {
  runWeatherForecastUpdate,
  schedule: '0 */6 * * *', // Every 6 hours
  description: 'Update weather forecasts for all active field locations',
  enabled: true,
  critical: false,
};

