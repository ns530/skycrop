/**
 * Weather Forecast Job
 *
 * Scheduled job to update weather forecasts for all active field locations
 * Runs every 6 hours
 */

import logger from '../config/logger.config';
import { Field } from '../models/index';
import weatherService from '../services/weather.service';

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

    for (let i = 0; i < fields.length; i += 1) {
      const field = fields[i];
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
        field_id: field.field_id,
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
    const locationKeys = Array.from(locationGroups.keys());
    const processLocations = async index => {
      if (index >= locationKeys.length) return;

      const locationKey = locationKeys[index];
      const locationData = locationGroups.get(locationKey);

      try {
        logger.debug(
          `Fetching weather for location: ${locationKey} (${locationData.fields.length} fields)`
        );

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
        const cachePromises = locationData.fields.map(fieldInfo => {
          return weatherService
            .cacheWeatherData(fieldInfo.field_id, {
              forecast,
              alerts,
              cachedAt: new Date(),
            })
            .catch(cacheError => {
              logger.error(`Error caching weather for field ${fieldInfo.field_id}:`, cacheError);
            });
        });
        await Promise.all(cachePromises);
        results.fieldsUpdated += locationData.fields.length;

        results.success += 1;
        logger.info(
          `Successfully updated weather for ${locationData.fields.length} fields at ${locationKey}`
        );

        // Check for severe weather alerts and send notifications
        if (alerts && alerts.length > 0) {
          for (let k = 0; k < alerts.length; k += 1) {
            const alert = alerts[k];
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
        await new Promise(resolve => {
          setTimeout(() => resolve(), 1000);
        });
      } catch (error) {
        logger.error(`Error fetching weather for location ${locationKey}:`, error);
        results.failed += 1;
        results.errors.push({
          location: locationKey,
          fieldsCount: locationData.fields.length,
          error: error.message,
        });
      }

      await processLocations(index + 1);
    };

    await processLocations(0);

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
