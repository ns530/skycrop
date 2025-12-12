// eslint-disable-next-line import/no-unresolved
const Bull = require('bull');
const { logger } = require('../utils/logger');
const { getEmailService } = require('../services/email.service');
const { getPushNotificationService } = require('../services/pushNotification.service');

/**
 * Notification Queue
 * Handles async email and push notification sending
 *
 * For MVP: Uses in-memory queue (simple implementation)
 * For Production: Integrate with Bull/BullMQ + Redis
 */
class NotificationQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.useBull = process.env.USEBULLQUEUE === 'true';

    if (this.useBull) {
      this.initBull();
    } else {
      logger.info('NotificationQueue: Using in-memory queue (MVP mode)');
      this.startProcessor();
    }
  }

  initBull() {
    try {
      const redisUrl = process.env.REDISURL || 'redis://localhost:6379';

      this.bullQueue = new Bull('notification-queue', redisUrl, {
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });

      this.bullQueue.process('send-email', this.processEmailJob.bind(this));
      this.bullQueue.process('send-push', this.processPushJob.bind(this));

      this.bullQueue.on('completed', job => {
        logger.info('notification.queue.completed', {
          jobId: job.id,
          type: job.name,
        });
      });

      this.bullQueue.on('failed', (job, err) => {
        logger.error('notification.queue.failed', {
          jobId: job.id,
          type: job.name,
          error: err.message,
          attempts: job.attemptsMade,
        });
      });

      logger.info('NotificationQueue: Bull queue initialized');
    } catch (error) {
      logger.warn('Bull not available, falling back to in-memory queue', { error: error.message });
      this.useBull = false;
      this.startProcessor();
    }
  }

  startProcessor() {
    // Process queue every 1 second
    setInterval(async () => {
      if (!this.processing && this.queue.length > 0) {
        this.processing = true;
        await this.processQueue();
        this.processing = false;
      }
    }, 1000);
  }

  async processQueue() {
    const processJob = async job => {
      try {
        if (job.type === 'email') {
          await this.processEmailJob({ data: job.data });
        } else if (job.type === 'push') {
          await this.processPushJob({ data: job.data });
        }
        logger.info('notification.queue.completed', {
          type: job.type,
          to: job.data.to || job.data.user_id,
        });
      } catch (error) {
        logger.error('notification.queue.failed', {
          type: job.type,
          error: error.message,
        });

        // Retry logic (simple)
        const currentRetries = job.retries || 0;
        if (currentRetries < 2) {
          this.queue.push({ ...job, retries: currentRetries + 1 }); // Re-queue with incremented retry count
        }
      }
    };

    const jobsToProcess = this.queue.splice(0);
    const processJobs = async (jobs, index = 0) => {
      if (index >= jobs.length) return;
      await processJob(jobs[index]);
      await processJobs(jobs, index + 1);
    };
    await processJobs(jobsToProcess);
  }

  async processEmailJob(job) {
    const emailService = getEmailService();

    const { to, subject, html, text } = job.data;
    await emailService.sendEmail({ to, subject, html, text });
  }

  async processPushJob(job) {
    const pushService = getPushNotificationService();

    const { user_id: userId, title, body, data } = job.data;
    await pushService.sendToUser(userId, title, body, data);
  }

  /**
   * Add email to queue
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Job info
   */
  async addEmail(emailData) {
    if (this.useBull && this.bullQueue) {
      const job = await this.bullQueue.add('send-email', emailData);
      return { jobId: job.id, type: 'email' };
    }
    const jobId = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.queue.push({
      id: jobId,
      type: 'email',
      data: emailData,
      addedAt: new Date(),
    });
    return { jobId, type: 'email' };
  }

  /**
   * Add push notification to queue
   * @param {Object} pushData - Push notification data
   * @returns {Promise<Object>} Job info
   */
  async addPush(pushData) {
    if (this.useBull && this.bullQueue) {
      const job = await this.bullQueue.add('send-push', pushData);
      return { jobId: job.id, type: 'push' };
    }
    const jobId = `push-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.queue.push({
      id: jobId,
      type: 'push',
      data: pushData,
      addedAt: new Date(),
    });
    return { jobId, type: 'push' };
  }

  /**
   * Get queue stats
   * @returns {Object} Queue statistics
   */
  getStats() {
    if (this.useBull && this.bullQueue) {
      return this.bullQueue.getJobCounts().then(counts => ({
        ...counts,
        provider: 'bull',
      }));
    }
    return Promise.resolve({
      waiting: this.queue.length,
      active: this.processing ? 1 : 0,
      completed: 0,
      failed: 0,
      provider: 'memory',
    });
  }
}

// Singleton instance
let queueInstance;

function getNotificationQueue() {
  if (!queueInstance) {
    queueInstance = new NotificationQueue();
  }
  return queueInstance;
}

module.exports = {
  NotificationQueue,
  getNotificationQueue,
};
