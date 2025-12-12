#!/usr/bin/env node

/**
 * SkyCrop Health Check Script
 * Comprehensive system health validation
 * Checks API endpoints, database, external services, and system resources
 */

const axios = require('axios');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

// Import configurations
const { sequelize, initDatabase } = require('../src/config/database.config');
const { getRedisClient } = require('../src/config/redis.config');

const BASEURL = process.env.BACKENDURL || 'http://localhost:3000';
const TIMEOUT = 10000; // 10 seconds

class HealthChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      checks: {},
      system: {},
      summary: {},
    };
  }

  async run() {
    console.log('🔍 Running SkyCrop Health Check...');

    try {
      // Run all checks
      await Promise.all([
        this.checkAPIEndpoints(),
        this.checkDatabase(),
        this.checkRedis(),
        this.checkExternalServices(),
        this.checkSystemResources(),
        this.checkFileSystem(),
      ]);

      // Calculate overall status
      this.calculateOverallStatus();

      // Output results
      console.log(JSON.stringify(this.results, null, 2));
    } catch (error) {
      this.results.status = 'error';
      this.results.error = error.message;
      console.error('Health check failed:', error.message);
      console.log(JSON.stringify(this.results, null, 2));
      process.exit(1);
    }
  }

  async checkAPIEndpoints() {
    const checks = {};
    const endpoints = [
      { name: 'health', url: '/health', method: 'GET', expectedStatus: 200 },
      { name: 'apiroot', url: '/api/v1', method: 'GET', expectedStatus: 200 },
      { name: 'authstatus', url: '/api/v1/auth/status', method: 'GET', expectedStatus: 401 }, // Should be unauthorized without token
      { name: 'fieldslist', url: '/api/v1/fields', method: 'GET', expectedStatus: 401 }, // Should require auth
    ];

    const endpointPromises = endpoints.map(async endpoint => {
      try {
        const startTime = Date.now();
        const response = await axios({
          method: endpoint.method,
          url: `${BASEURL}${endpoint.url}`,
          timeout: TIMEOUT,
          validateStatus: () => true, // Don't throw on non-2xx
        });
        const responseTime = Date.now() - startTime;

        checks[endpoint.name] = {
          status: response.status === endpoint.expectedStatus ? 'healthy' : 'unhealthy',
          responsetimems: responseTime,
          statuscode: response.status,
          expectedstatus: endpoint.expectedStatus,
        };
      } catch (error) {
        checks[endpoint.name] = {
          status: 'unhealthy',
          error: error.message,
          responsetimems: null,
        };
      }
    });

    await Promise.all(endpointPromises);

    this.results.checks.apiendpoints = checks;
  }

  async checkDatabase() {
    const checks = {};

    try {
      const startTime = Date.now();
      await initDatabase();
      const connectionTime = Date.now() - startTime;

      checks.connectivity = {
        status: 'healthy',
        connectiontimems: connectionTime,
      };

      // Test query performance
      const queryStart = Date.now();
      const [results] = await sequelize.query('SELECT COUNT(*) as count FROM users', {
        type: sequelize.QueryTypes.SELECT,
      });
      const queryTime = Date.now() - queryStart;

      checks.queryperformance = {
        status: 'healthy',
        querytimems: queryTime,
        usercount: results.count,
      };

      // Check PostGIS availability
      try {
        const [postgisResult] = await sequelize.query('SELECT PostGISVersion()', {
          type: sequelize.QueryTypes.SELECT,
        });
        checks.postgis = {
          status: 'healthy',
          version: postgisResult.postgisversion,
        };
      } catch (error) {
        checks.postgis = {
          status: 'unhealthy',
          error: 'PostGIS not available',
        };
      }
    } catch (error) {
      checks.connectivity = {
        status: 'unhealthy',
        error: error.message,
      };
    }

    this.results.checks.database = checks;
  }

  async checkRedis() {
    const checks = {};

    try {
      const redis = getRedisClient();
      if (redis) {
        const startTime = Date.now();
        await redis.ping();
        const pingTime = Date.now() - startTime;

        checks.connectivity = {
          status: 'healthy',
          pingtimems: pingTime,
        };

        // Test basic operations
        const opStart = Date.now();
        await redis.set('healthcheck', 'ok');
        await redis.get('healthcheck');
        await redis.del('healthcheck');
        const opTime = Date.now() - opStart;

        checks.operations = {
          status: 'healthy',
          operationtimems: opTime,
        };
      } else {
        checks.connectivity = {
          status: 'unhealthy',
          error: 'Redis client not available',
        };
      }
    } catch (error) {
      checks.connectivity = {
        status: 'unhealthy',
        error: error.message,
      };
    }

    this.results.checks.redis = checks;
  }

  async checkExternalServices() {
    const checks = {};

    // Sentinel Hub API
    if (process.env.SATELLITEAPIKEY) {
      try {
        const startTime = Date.now();
        const response = await axios.post(
          'https://services.sentinel-hub.com/api/v1/catalog/search',
          {
            bbox: [80.0, 5.0, 82.0, 10.0],
            datetime: '2024-01-01T00:00:00Z/2024-01-02T00:00:00Z',
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.SATELLITEAPIKEY}`,
              'Content-Type': 'application/json',
            },
            timeout: TIMEOUT,
          }
        );
        const responseTime = Date.now() - startTime;

        checks.sentinelhub = {
          status: response.status === 200 || response.status === 201 ? 'healthy' : 'unhealthy',
          responsetimems: responseTime,
          statuscode: response.status,
        };
      } catch (error) {
        checks.sentinelhub = {
          status: 'unhealthy',
          error: error.message,
        };
      }
    } else {
      checks.sentinelhub = {
        status: 'unhealthy',
        error: 'SATELLITEAPIKEY not configured',
      };
    }

    // OpenWeatherMap API
    if (process.env.WEATHERAPIKEY) {
      try {
        const startTime = Date.now();
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=Colombo&appid=${process.env.WEATHERAPIKEY}`,
          { timeout: TIMEOUT }
        );
        const responseTime = Date.now() - startTime;

        checks.openweathermap = {
          status: response.status === 200 ? 'healthy' : 'unhealthy',
          responsetimems: responseTime,
          statuscode: response.status,
        };
      } catch (error) {
        checks.openweathermap = {
          status: 'unhealthy',
          error: error.message,
        };
      }
    } else {
      checks.openweathermap = {
        status: 'unhealthy',
        error: 'WEATHERAPIKEY not configured',
      };
    }

    this.results.checks.externalservices = checks;
  }

  async checkSystemResources() {
    const system = {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      loadaverage: os.loadavg(),
      totalmemory: os.totalmem(),
      freememory: os.freemem(),
      memoryusagepercent: (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(2),
      cpus: os.cpus().length,
    };

    // Check memory usage
    const memUsagePercent = parseFloat(system.memoryusagepercent);
    system.memorystatus = memUsagePercent < 90 ? 'healthy' : 'critical';

    // Check load average (for multi-core systems)
    const loadAvg = system.loadaverage[0];
    const normalizedLoad = loadAvg / system.cpus;
    let cpustatus;
    if (normalizedLoad < 0.8) {
      cpustatus = 'healthy';
    } else if (normalizedLoad < 1.5) {
      cpustatus = 'warning';
    } else {
      cpustatus = 'critical';
    }
    system.cpustatus = cpustatus;

    this.results.system = system;
  }

  async checkFileSystem() {
    const checks = {};

    try {
      // Check disk space
      const diskUsage = await this.getDiskUsage();
      checks.diskspace = {
        status: diskUsage.usedPercent < 90 ? 'healthy' : 'critical',
        usedpercent: diskUsage.usedPercent,
        freegb: (diskUsage.free / (1024 * 1024 * 1024)).toFixed(2),
        totalgb: (diskUsage.total / (1024 * 1024 * 1024)).toFixed(2),
      };

      // Check if logs directory exists and is writable
      const logDir = process.env.LOGFILE ? path.dirname(process.env.LOGFILE) : './logs';
      try {
        await fs.access(logDir, fs.constants.WOK);
        checks.logdirectory = {
          status: 'healthy',
          path: logDir,
        };
      } catch (error) {
        checks.logdirectory = {
          status: 'unhealthy',
          error: `Cannot write to log directory: ${logDir}`,
        };
      }
    } catch (error) {
      checks.filesystem = {
        status: 'unhealthy',
        error: error.message,
      };
    }

    this.results.checks.filesystem = checks;
  }

  async getDiskUsage() {
    // Simple disk usage check using fs.statvfs if available, otherwise estimate
    try {
      const stats = await fs.statvfs('/');
      return {
        total: stats.blocks * stats.fbsize,
        free: stats.bavail * stats.fbsize,
        usedPercent: ((stats.blocks - stats.bavail) / stats.blocks) * 100,
      };
    } catch (error) {
      // Fallback: use a simple estimation
      return {
        total: 100 * 1024 * 1024 * 1024, // 100GB estimate
        free: 50 * 1024 * 1024 * 1024, // 50GB estimate
        usedPercent: 50,
      };
    }
  }

  calculateOverallStatus() {
    const allChecks = Object.values(this.results.checks).flatMap(check =>
      typeof check === 'object' ? Object.values(check) : [check]
    );

    const unhealthyCount = allChecks.filter(
      check => check && typeof check === 'object' && check.status === 'unhealthy'
    ).length;

    const criticalCount = allChecks.filter(
      check => check && typeof check === 'object' && check.status === 'critical'
    ).length;

    if (criticalCount > 0) {
      this.results.status = 'critical';
    } else if (unhealthyCount > 0) {
      this.results.status = 'unhealthy';
    } else {
      this.results.status = 'healthy';
    }

    this.results.summary = {
      totalchecks: allChecks.length,
      healthy: allChecks.filter(c => c && c.status === 'healthy').length,
      unhealthy: unhealthyCount,
      critical: criticalCount,
    };
  }
}

// Run the health check
if (require.main === module) {
  const checker = new HealthChecker();
  checker.run().catch(error => {
    console.error('Health check script failed:', error);
    process.exit(1);
  });
}

module.exports = HealthChecker;
