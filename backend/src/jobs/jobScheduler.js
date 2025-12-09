/**
 * Job Scheduler - Central Scheduled Jobs Manager
 *
 * Manages all cron jobs for automated tasks:
 * - Health monitoring updates
 * - Recommendations generation
 * - Weather forecast updates
 * - Yield prediction updates
 */

'use strict';

const cron = require('node-cron');
const logger = require('../config/logger.config');

class JobScheduler {
  constructor() {
    this.jobs = new Map();
    this.jobStats = new Map();
  }

  /**
   * Register a new scheduled job
   * 
   * @param {string} name - Job name
   * @param {string} schedule - Cron schedule expression
   * @param {Function} handler - Job handler function
   * @param {Object} options - Additional options
   */
  registerJob(name, schedule, handler, options = {}) {
    if (this.jobs.has(name)) {
      logger.warn(`Job "${name}" already registered. Skipping.`);
      return;
    }

    // Validate cron schedule
    if (!cron.validate(schedule)) {
      logger.error(`Invalid cron schedule for job "${name}": ${schedule}`);
      throw new Error(`Invalid cron schedule: ${schedule}`);
    }

    // Initialize job stats
    this.jobStats.set(name, {
      name,
      schedule,
      lastRun: null,
      nextRun: null,
      successCount: 0,
      failureCount: 0,
      lastError: null,
      isRunning: false,
      enabled: options.enabled !== false,
    });

    // Wrap handler with error handling and logging
    const wrappedHandler = async () => {
      const stats = this.jobStats.get(name);
      
      if (!stats.enabled) {
        logger.debug(`Job "${name}" is disabled. Skipping execution.`);
        return;
      }

      if (stats.isRunning) {
        logger.warn(`Job "${name}" is already running. Skipping this execution.`);
        return;
      }

      const startTime = Date.now();
      stats.isRunning = true;
      stats.lastRun = new Date();

      logger.info(`Starting job: ${name}`);

      try {
        await handler();
        
        stats.successCount++;
        stats.lastError = null;
        
        const duration = Date.now() - startTime;
        logger.info(`Job "${name}" completed successfully in ${duration}ms`);
      } catch (error) {
        stats.failureCount++;
        stats.lastError = {
          message: error.message,
          stack: error.stack,
          timestamp: new Date(),
        };
        
        logger.error(`Job "${name}" failed:`, error);
        
        // Optionally send alert for critical jobs
        if (options.critical) {
          this._sendJobFailureAlert(name, error);
        }
      } finally {
        stats.isRunning = false;
        this.jobStats.set(name, stats);
      }
    };

    // Create and schedule the cron job
    const task = cron.schedule(schedule, wrappedHandler, {
      scheduled: false,
      timezone: options.timezone || 'Asia/Colombo',
    });

    this.jobs.set(name, task);

    logger.info(`Job "${name}" registered with schedule: ${schedule}`);

    // Start immediately if requested
    if (options.runOnStart) {
      logger.info(`Running job "${name}" immediately on start`);
      wrappedHandler().catch(err => {
        logger.error(`Error running job "${name}" on start:`, err);
      });
    }
  }

  /**
   * Start a specific job
   * 
   * @param {string} name - Job name
   */
  startJob(name) {
    const job = this.jobs.get(name);
    if (!job) {
      logger.error(`Job "${name}" not found`);
      return false;
    }

    job.start();
    const stats = this.jobStats.get(name);
    stats.enabled = true;
    this.jobStats.set(name, stats);
    
    logger.info(`Job "${name}" started`);
    return true;
  }

  /**
   * Stop a specific job
   * 
   * @param {string} name - Job name
   */
  stopJob(name) {
    const job = this.jobs.get(name);
    if (!job) {
      logger.error(`Job "${name}" not found`);
      return false;
    }

    job.stop();
    const stats = this.jobStats.get(name);
    stats.enabled = false;
    this.jobStats.set(name, stats);
    
    logger.info(`Job "${name}" stopped`);
    return true;
  }

  /**
   * Start all registered jobs
   */
  startAll() {
    logger.info(`Starting ${this.jobs.size} scheduled jobs...`);
    
    this.jobs.forEach((job, name) => {
      job.start();
      const stats = this.jobStats.get(name);
      stats.enabled = true;
      this.jobStats.set(name, stats);
    });
    
    logger.info('All jobs started');
  }

  /**
   * Stop all registered jobs
   */
  stopAll() {
    logger.info('Stopping all scheduled jobs...');
    
    this.jobs.forEach((job, name) => {
      job.stop();
      const stats = this.jobStats.get(name);
      stats.enabled = false;
      this.jobStats.set(name, stats);
    });
    
    logger.info('All jobs stopped');
  }

  /**
   * Get statistics for a specific job
   * 
   * @param {string} name - Job name
   * @returns {Object|null} Job statistics
   */
  getJobStats(name) {
    return this.jobStats.get(name) || null;
  }

  /**
   * Get statistics for all jobs
   * 
   * @returns {Array} Array of job statistics
   */
  getAllJobStats() {
    return Array.from(this.jobStats.values());
  }

  /**
   * Send alert for critical job failures
   * 
   * @private
   * @param {string} jobName - Job name
   * @param {Error} error - Error object
   */
  _sendJobFailureAlert(jobName, error) {
    // TODO: Implement alerting mechanism (email, Slack, etc.)
    logger.error(`CRITICAL JOB FAILURE: ${jobName}`, {
      error: error.message,
      stack: error.stack,
    });
  }

  /**
   * Manually trigger a job (for testing or manual execution)
   * 
   * @param {string} name - Job name
   */
  async triggerJob(name) {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Job "${name}" not found`);
    }

    logger.info(`Manually triggering job: ${name}`);
    // Get the task function and execute it
    // Note: cron jobs don't expose their function directly, so we'd need to store it separately
    // For now, just log that it was requested
    logger.warn(`Manual job triggering not fully implemented yet for "${name}"`);
  }
}

// Singleton instance
const jobScheduler = new JobScheduler();

module.exports = jobScheduler;

