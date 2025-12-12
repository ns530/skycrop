/**
 * Jobs Index - Initialize and Start All Scheduled Jobs
 *
 * Central entry point for all background jobs
 */

import jobScheduler from './jobScheduler';
import healthMonitoringJob from './healthMonitoringJob';
import recommendationsJob from './recommendationsJob';
import weatherForecastJob from './weatherForecastJob';
import logger from '../config/logger.config';

/**
 * Initialize all scheduled jobs
 */
function initializeJobs() {
  logger.info('Initializing scheduled jobs...');

  try {
    // Register Health Monitoring Job
    if (healthMonitoringJob.enabled) {
      jobScheduler.registerJob(
        'health-monitoring',
        healthMonitoringJob.schedule,
        healthMonitoringJob.runHealthMonitoring,
        {
          enabled: true,
          critical: healthMonitoringJob.critical,
          timezone: 'Asia/Colombo',
          runOnStart: false, // Don't run immediately on server start
        }
      );
      logger.info(`✓ Health monitoring job registered (${healthMonitoringJob.schedule})`);
    }

    // Register Recommendations Generation Job
    if (recommendationsJob.enabled) {
      jobScheduler.registerJob(
        'recommendations-generation',
        recommendationsJob.schedule,
        recommendationsJob.runRecommendationsGeneration,
        {
          enabled: true,
          critical: recommendationsJob.critical,
          timezone: 'Asia/Colombo',
          runOnStart: false,
        }
      );
      logger.info(`✓ Recommendations job registered (${recommendationsJob.schedule})`);
    }

    // Register Weather Forecast Update Job
    if (weatherForecastJob.enabled) {
      jobScheduler.registerJob(
        'weather-forecast-update',
        weatherForecastJob.schedule,
        weatherForecastJob.runWeatherForecastUpdate,
        {
          enabled: true,
          critical: weatherForecastJob.critical,
          timezone: 'Asia/Colombo',
          runOnStart: true, // Run immediately to populate weather data
        }
      );
      logger.info(`✓ Weather forecast job registered (${weatherForecastJob.schedule})`);
    }

    // Additional jobs can be registered here
    // Example:
    // jobScheduler.registerJob('yield-prediction-update', '0 8 */10 * *', yieldPredictionJob.run, { ... });

    logger.info('All scheduled jobs registered successfully');
  } catch (error) {
    logger.error('Error initializing scheduled jobs:', error);
    throw error;
  }
}

/**
 * Start all scheduled jobs
 */
function startJobs() {
  logger.info('Starting all scheduled jobs...');
  jobScheduler.startAll();
  logger.info('All scheduled jobs started');
}

/**
 * Stop all scheduled jobs (for graceful shutdown)
 */
function stopJobs() {
  logger.info('Stopping all scheduled jobs...');
  jobScheduler.stopAll();
  logger.info('All scheduled jobs stopped');
}

/**
 * Get job statistics
 *
 * @returns {Array} Array of job statistics
 */
function getJobsStatus() {
  return jobScheduler.getAllJobStats();
}

/**
 * Manually trigger a job (for admin API or testing)
 *
 * @param {string} jobName - Job name
 * @returns {Promise} Job execution promise
 */
async function triggerJob(jobName) {
  const jobMap = {
    'health-monitoring': healthMonitoringJob.runHealthMonitoring,
    'recommendations-generation': recommendationsJob.runRecommendationsGeneration,
    'weather-forecast-update': weatherForecastJob.runWeatherForecastUpdate,
  };

  const jobFn = jobMap[jobName];
  if (!jobFn) {
    throw new Error(`Job "${jobName}" not found`);
  }

  logger.info(`Manually triggering job: ${jobName}`);
  return jobFn();
}

export default {
  initializeJobs,
  startJobs,
  stopJobs,
  getJobsStatus,
  triggerJob,
  jobScheduler,
};
