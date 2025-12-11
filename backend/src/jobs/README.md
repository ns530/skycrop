# SkyCrop Backend Scheduled Jobs Framework

Automated background job system for SkyCrop using `node-cron`.

## 📋 Overview

The scheduled jobs framework provides automated execution of recurring tasks:

- **Health Monitoring** - Daily crop health data updates (NDVI/NDWI/TDVI)
- **Recommendations** - Weekly farming recommendations generation
- **Weather Forecasts** - 6-hourly weather data updates
- **Future**: Yield predictions, alerts, notifications

## 🚀 Architecture

```
src/jobs/
├── jobScheduler.js           # Central job scheduler (singleton)
├── healthMonitoringJob.js    # Daily health updates
├── recommendationsJob.js     # Weekly recommendations
├── weatherForecastJob.js     # 6-hourly weather updates
├── index.js                  # Jobs initialization & exports
└── README.md                 # This file
```

### Key Components

1. **JobScheduler** - Manages all cron jobs with:
   - Job registration and lifecycle management
   - Error handling and retry logic
   - Statistics tracking (success/failure counts)
   - Manual job triggering
   - Enable/disable individual jobs

2. **Job Handlers** - Individual job implementations:
   - Self-contained execution logic
   - Progress logging
   - Error recovery
   - Result summaries

3. **Admin API** - REST endpoints for job management:
   - View job status and statistics
   - Manually trigger jobs
   - Enable/disable jobs
   - Monitor job health

## 📅 Job Schedules

| Job               | Schedule                | Cron Expression | Frequency |
| ----------------- | ----------------------- | --------------- | --------- |
| Health Monitoring | Daily 6:00 AM           | `0 6 * * *`     | 24 hours  |
| Recommendations   | Weekly (Sunday 7:00 AM) | `0 7 */7 * *`   | 7 days    |
| Weather Forecast  | Every 6 hours           | `0 */6 * * *`   | 6 hours   |

All times are in **Asia/Colombo** timezone (UTC+5:30).

## 🔧 Configuration

### Environment Variables

```bash
# Logging level for jobs
LOG_LEVEL=info

# Enable/disable jobs (default: true)
ENABLE_HEALTH_MONITORING=true
ENABLE_RECOMMENDATIONS=true
ENABLE_WEATHER_FORECAST=true

# Job-specific settings
HEALTH_UPDATE_HOUR=6           # Hour to run health monitoring (0-23)
RECOMMENDATIONS_DAY=0          # Day of week (0=Sunday, 6=Saturday)
WEATHER_UPDATE_INTERVAL=6      # Hours between weather updates
```

### Job Configuration

Jobs can be configured in their respective files:

```javascript
// healthMonitoringJob.js
module.exports = {
  runHealthMonitoring,
  schedule: '0 6 * * *', // Cron expression
  description: 'Update crop health data',
  enabled: true, // Enable/disable
  critical: true, // Send alerts on failure
};
```

## 🎯 Usage

### Automatic Startup

Jobs initialize automatically when the server starts:

```javascript
// src/server.js
const { initializeJobs, startJobs } = require('./jobs');

async function start() {
  // ... database initialization ...

  initializeJobs(); // Register all jobs
  startJobs(); // Start cron schedules
}
```

### Graceful Shutdown

Jobs stop gracefully on server shutdown:

```javascript
const { stopJobs } = require('./jobs');

process.on('SIGTERM', () => {
  stopJobs(); // Stop all scheduled jobs
  // ... other cleanup ...
});
```

### Manual Execution

Trigger jobs manually via Admin API or programmatically:

```javascript
const { triggerJob } = require('./jobs');

// Programmatic trigger
await triggerJob('health-monitoring');
```

## 🔐 Admin API

### Endpoints

All endpoints require authentication and admin role:

```
GET    /api/v1/admin/jobs              # List all jobs with status
GET    /api/v1/admin/jobs/:jobName     # Get specific job status
POST   /api/v1/admin/jobs/:jobName/trigger   # Manually trigger job
POST   /api/v1/admin/jobs/:jobName/enable    # Enable job
POST   /api/v1/admin/jobs/:jobName/disable   # Disable job
```

### Examples

**List all jobs:**

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:4000/api/v1/admin/jobs
```

Response:

```json
{
  "success": true,
  "data": {
    "totalJobs": 3,
    "activeJobs": 3,
    "jobs": [
      {
        "name": "health-monitoring",
        "schedule": "0 6 * * *",
        "enabled": true,
        "isRunning": false,
        "lastRun": "2025-11-21T06:00:00.000Z",
        "stats": {
          "successCount": 15,
          "failureCount": 0,
          "successRate": "100.0%"
        },
        "lastError": null
      }
      // ... other jobs
    ]
  }
}
```

**Manually trigger a job:**

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  http://localhost:4000/api/v1/admin/jobs/health-monitoring/trigger
```

**Disable a job:**

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  http://localhost:4000/api/v1/admin/jobs/weather-forecast-update/disable
```

## 📊 Job Statistics

Each job tracks:

- **Execution counts** - Success and failure tallies
- **Last run time** - When job last executed
- **Next run time** - When job will execute next
- **Running status** - Whether job is currently executing
- **Last error** - Most recent failure details (if any)
- **Success rate** - Percentage of successful executions

## 🔍 Monitoring

### Logs

All job executions are logged with structured data:

```
[2025-11-21 06:00:00] [info]: Starting job: health-monitoring
[2025-11-21 06:00:25] [info]: Job "health-monitoring" completed successfully in 25432ms
```

Job statistics are logged on completion:

```javascript
{
  total: 120,
  success: 118,
  failed: 2,
  skipped: 0,
  successRate: "98.3%"
}
```

### Errors

Failed jobs log detailed error information:

```
[2025-11-21 06:05:12] [error]: Job "health-monitoring" failed: {
  message: "Network timeout",
  stack: "...",
  fieldId: "abc-123",
  fieldName: "Paddy Field A"
}
```

Critical job failures trigger alerts (configurable).

## 🧪 Testing Jobs

### Manual Trigger via API

Use the Admin API to test jobs without waiting for schedule:

```bash
# Test health monitoring
curl -X POST \
  -H "Authorization: Bearer <admin-token>" \
  http://localhost:4000/api/v1/admin/jobs/health-monitoring/trigger
```

### Programmatic Testing

```javascript
const { runHealthMonitoring } = require('./jobs/healthMonitoringJob');

describe('Health Monitoring Job', () => {
  it('should update health for all active fields', async () => {
    const result = await runHealthMonitoring();

    expect(result.success).toBeGreaterThan(0);
    expect(result.failed).toBe(0);
  });
});
```

### Mock Mode

Set environment variable for testing:

```bash
NODE_ENV=test npm test
```

Jobs will use mock data and skip external API calls.

## 🚧 Adding New Jobs

1. **Create job file:**

```javascript
// src/jobs/myNewJob.js
const logger = require('../config/logger.config');

async function runMyNewJob() {
  logger.info('Starting my new job...');

  try {
    // Job logic here

    logger.info('My new job completed');
    return { success: true };
  } catch (error) {
    logger.error('My new job failed:', error);
    throw error;
  }
}

module.exports = {
  runMyNewJob,
  schedule: '0 0 * * *', // Daily at midnight
  description: 'My new job description',
  enabled: true,
  critical: false,
};
```

2. **Register job:**

```javascript
// src/jobs/index.js
const myNewJob = require('./myNewJob');

function initializeJobs() {
  // ... existing jobs ...

  if (myNewJob.enabled) {
    jobScheduler.registerJob('my-new-job', myNewJob.schedule, myNewJob.runMyNewJob, {
      enabled: true,
      critical: myNewJob.critical,
      timezone: 'Asia/Colombo',
      runOnStart: false,
    });
  }
}
```

3. **Update trigger map:**

```javascript
// src/jobs/index.js
async function triggerJob(jobName) {
  const jobMap = {
    // ... existing jobs ...
    'my-new-job': myNewJob.runMyNewJob,
  };
  // ... rest of function ...
}
```

## 📝 Best Practices

1. **Idempotency** - Jobs should be safe to run multiple times
2. **Error Handling** - Catch and log errors, don't crash the server
3. **Rate Limiting** - Add delays between API calls to avoid throttling
4. **Resource Management** - Clean up connections and resources
5. **Progress Logging** - Log progress for long-running jobs
6. **Skip Logic** - Skip unnecessary work (e.g., recent data exists)
7. **Batch Processing** - Process records in batches for large datasets
8. **Alerting** - Notify on critical job failures

## 🛠️ Troubleshooting

### Job Not Running

1. Check job is enabled:

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:4000/api/v1/admin/jobs
```

2. Check server logs for errors during initialization

3. Verify cron expression is valid:

```javascript
const cron = require('node-cron');
console.log(cron.validate('0 6 * * *')); // true
```

### Job Failing

1. Check job statistics for last error:

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:4000/api/v1/admin/jobs/health-monitoring
```

2. Review server logs for detailed error stack traces

3. Manually trigger with verbose logging:

```bash
LOG_LEVEL=debug npm start
```

### High Failure Rate

1. Check external service availability (Sentinel Hub, OpenWeatherMap)
2. Verify API rate limits not exceeded
3. Review database connection pool settings
4. Check network connectivity and timeouts

## 📚 References

- [node-cron documentation](https://github.com/node-cron/node-cron)
- [Cron expression syntax](https://crontab.guru/)
- [Winston logging](https://github.com/winstonjs/winston)

---

**Last Updated:** November 21, 2025  
**Version:** 1.0.0  
**Maintainer:** SkyCrop Backend Team
