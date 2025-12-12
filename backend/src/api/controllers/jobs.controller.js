/**
 * Jobs Controller - Admin API for Scheduled Jobs Management
 *
 * Provides endpoints to monitor and control background jobs
 */

const { getJobsStatus, triggerJob, jobScheduler } = require('../../jobs');
const { logger } = require('../../utils/logger');

/**
 * Get status of all scheduled jobs
 *
 * @route GET /api/v1/admin/jobs
 */
const getAllJobsStatus = async (req, res) => {
  try {
    const jobs = getJobsStatus();

    const response = {
      success: true,
      data: {
        totalJobs: jobs.length,
        activeJobs: jobs.filter(j => j.enabled).length,
        jobs: jobs.map(job => ({
          name: job.name,
          schedule: job.schedule,
          enabled: job.enabled,
          isRunning: job.isRunning,
          lastRun: job.lastRun,
          nextRun: job.nextRun,
          stats: {
            successCount: job.successCount,
            failureCount: job.failureCount,
            successRate:
              job.successCount + job.failureCount > 0
                ? `${((job.successCount / (job.successCount + job.failureCount)) * 100).toFixed(1)}%`
                : 'N/A',
          },
          lastError: job.lastError
            ? {
                message: job.lastError.message,
                timestamp: job.lastError.timestamp,
              }
            : null,
        })),
      },
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching jobs status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNALERROR',
        message: 'Failed to fetch jobs status',
      },
    });
  }
};

/**
 * Get status of a specific job
 *
 * @route GET /api/v1/admin/jobs/:jobName
 */
const getJobStatus = async (req, res) => {
  try {
    const { jobName } = req.params;
    const job = jobScheduler.getJobStats(jobName);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'JOBNOTFOUND',
          message: `Job "${jobName}" not found`,
        },
      });
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    logger.error('Error fetching job status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNALERROR',
        message: 'Failed to fetch job status',
      },
    });
  }
};

/**
 * Manually trigger a job
 *
 * @route POST /api/v1/admin/jobs/:jobName/trigger
 */
const triggerJobManually = async (req, res) => {
  try {
    const { jobName } = req.params;

    logger.info(`Admin manually triggering job: ${jobName}`, {
      adminId: req.user?.user_id,
    });

    // Trigger the job asynchronously
    const resultPromise = triggerJob(jobName);

    // Respond immediately that job was triggered
    res.json({
      success: true,
      message: `Job "${jobName}" triggered successfully`,
      data: {
        jobName,
        triggeredAt: new Date().toISOString(),
        triggeredBy: req.user?.user_id,
      },
    });

    // Wait for job completion in background
    try {
      const result = await resultPromise;
      logger.info(`Manually triggered job "${jobName}" completed:`, result);
    } catch (jobError) {
      logger.error(`Manually triggered job "${jobName}" failed:`, jobError);
    }
  } catch (error) {
    logger.error('Error triggering job:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'JOBNOTFOUND',
          message: error.message,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNALERROR',
        message: 'Failed to trigger job',
      },
    });
  }
};

/**
 * Enable a job
 *
 * @route POST /api/v1/admin/jobs/:jobName/enable
 */
const enableJob = async (req, res) => {
  try {
    const { jobName } = req.params;
    const success = jobScheduler.startJob(jobName);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'JOBNOTFOUND',
          message: `Job "${jobName}" not found`,
        },
      });
    }

    logger.info(`Job "${jobName}" enabled by admin`, {
      adminId: req.user?.user_id,
    });

    res.json({
      success: true,
      message: `Job "${jobName}" enabled successfully`,
    });
  } catch (error) {
    logger.error('Error enabling job:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNALERROR',
        message: 'Failed to enable job',
      },
    });
  }
};

/**
 * Disable a job
 *
 * @route POST /api/v1/admin/jobs/:jobName/disable
 */
const disableJob = async (req, res) => {
  try {
    const { jobName } = req.params;
    const success = jobScheduler.stopJob(jobName);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'JOBNOTFOUND',
          message: `Job "${jobName}" not found`,
        },
      });
    }

    logger.info(`Job "${jobName}" disabled by admin`, {
      adminId: req.user?.user_id,
    });

    res.json({
      success: true,
      message: `Job "${jobName}" disabled successfully`,
    });
  } catch (error) {
    logger.error('Error disabling job:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNALERROR',
        message: 'Failed to disable job',
      },
    });
  }
};

module.exports = {
  getAllJobsStatus,
  getJobStatus,
  triggerJobManually,
  enableJob,
  disableJob,
};
