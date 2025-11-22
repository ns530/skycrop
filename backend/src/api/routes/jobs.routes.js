/**
 * Jobs Routes - Admin API for Scheduled Jobs Management
 * 
 * @route /api/v1/admin/jobs
 */

const express = require('express');
const jobsController = require('../controllers/jobs.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
// Note: Add admin role middleware when available
// const requireAdmin = require('../middleware/requireAdmin.middleware');

const router = express.Router();

// All routes require authentication and admin role
// router.use(authMiddleware);
// router.use(requireAdmin);

// For now, just require authentication
router.use(authMiddleware);

// Get all jobs status
router.get('/', jobsController.getAllJobsStatus);

// Get specific job status
router.get('/:jobName', jobsController.getJobStatus);

// Manually trigger a job
router.post('/:jobName/trigger', jobsController.triggerJobManually);

// Enable a job
router.post('/:jobName/enable', jobsController.enableJob);

// Disable a job
router.post('/:jobName/disable', jobsController.disableJob);

module.exports = router;

