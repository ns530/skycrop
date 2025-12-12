#!/usr/bin/env node

/**
 * SkyCrop Performance Baseline Script
 * Establishes and validates performance benchmarks
 * Measures API response times, database performance, and system resources
 */

const axios = require('axios');
const os = require('os');
const fs = require('fs').promises;
const { sequelize } = require('../src/config/database.config');

const BASEURL = process.env.BACKENDURL || 'http://localhost:3000';
const APIBASE = `${BASEURL}/api/v1`;

// Performance thresholds from test plans
const THRESHOLDS = {
  api: {
    authentication: 1000, // <1 second
    fieldoperations: 2000, // <2 seconds
    healthdata: 3000, // <3 seconds
    imageprocessing: 60000, // <60 seconds
    general: 2000, // <2 seconds general API
  },
  database: {
    simplequery: 100, // <100ms
    complexquery: 500, // <500ms
    connection: 1000, // <1 second
  },
  system: {
    memoryusagepercent: 80, // <80%
    cpuload: 1.0, // <100% normalized
    diskusagepercent: 85, // <85%
  },
};

class PerformanceBaselineTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      benchmarks: {},
      metrics: {},
      comparisons: {},
      summary: {},
    };
    this.authToken = null;
    this.testUser = {
      email: `perf-test-${Date.now()}@example.com`,
      password: 'PerfTest123!',
      firstName: 'Perf',
      lastName: 'Test',
    };
    this.testField = null;
  }

  async run() {
    console.log('📊 Running SkyCrop Performance Baseline Tests...');

    try {
      // Setup test data
      await this.setupTestData();

      // Run performance tests
      await this.testAPIPerformance();
      await this.testDatabasePerformance();
      await this.testSystemPerformance();

      // Compare against thresholds
      this.compareAgainstThresholds();

      // Calculate overall status
      this.calculateOverallStatus();

      // Output results
      console.log(JSON.stringify(this.results, null, 2));
    } catch (error) {
      this.results.status = 'error';
      this.results.error = error.message;
      console.error('Performance baseline test failed:', error.message);
      console.log(JSON.stringify(this.results, null, 2));
      process.exit(1);
    } finally {
      await this.cleanupTestData();
    }
  }

  async setupTestData() {
    console.log('Setting up test data...');

    // Create test user
    await axios.post(`${APIBASE}/auth/register`, this.testUser, {
      timeout: 10000,
    });

    // Login to get token
    const loginResponse = await axios.post(
      `${APIBASE}/auth/login`,
      {
        email: this.testUser.email,
        password: this.testUser.password,
      },
      {
        timeout: 10000,
      }
    );

    this.authToken = loginResponse.data.token;

    // Create test field
    const fieldData = {
      name: 'Performance Test Field',
      boundary: {
        type: 'Polygon',
        coordinates: [
          [
            [80.123, 6.123],
            [80.456, 6.123],
            [80.456, 6.456],
            [80.123, 6.456],
            [80.123, 6.123],
          ],
        ],
      },
      area: 25.5,
      cropType: 'paddy',
    };

    const fieldResponse = await axios.post(`${APIBASE}/fields`, fieldData, {
      headers: { Authorization: `Bearer ${this.authToken}` },
      timeout: 10000,
    });

    this.testField = fieldResponse.data.field;
  }

  async testAPIPerformance() {
    console.log('Testing API performance...');

    const apiMetrics = {};

    // Authentication endpoints
    apiMetrics.authregister = await this.measureAPIEndpoint('POST', `${APIBASE}/auth/register`, {
      email: `temp-${Date.now()}@example.com`,
      password: 'TempPass123!',
      firstName: 'Temp',
      lastName: 'User',
    });

    apiMetrics.authlogin = await this.measureAPIEndpoint('POST', `${APIBASE}/auth/login`, {
      email: this.testUser.email,
      password: this.testUser.password,
    });

    // Field operations
    apiMetrics.fieldcreate = await this.measureAPIEndpoint(
      'POST',
      `${APIBASE}/fields`,
      {
        name: 'Temp Field',
        boundary: {
          type: 'Polygon',
          coordinates: [
            [
              [80.1, 6.1],
              [80.2, 6.1],
              [80.2, 6.2],
              [80.1, 6.2],
              [80.1, 6.1],
            ],
          ],
        },
        area: 10.0,
        cropType: 'paddy',
      },
      { Authorization: `Bearer ${this.authToken}` }
    );

    apiMetrics.fieldget = await this.measureAPIEndpoint(
      'GET',
      `${APIBASE}/fields/${this.testField.id}`,
      null,
      { Authorization: `Bearer ${this.authToken}` }
    );

    apiMetrics.fieldlist = await this.measureAPIEndpoint('GET', `${APIBASE}/fields`, null, {
      Authorization: `Bearer ${this.authToken}`,
    });

    // Health data operations
    apiMetrics.healthhistory = await this.measureAPIEndpoint(
      'GET',
      `${APIBASE}/fields/${this.testField.id}/health/history?start=2024-01-01&end=2024-12-31`,
      null,
      { Authorization: `Bearer ${this.authToken}` }
    );

    // Recommendation operations
    apiMetrics.recommendationsget = await this.measureAPIEndpoint(
      'GET',
      `${APIBASE}/fields/${this.testField.id}/recommendations`,
      null,
      { Authorization: `Bearer ${this.authToken}` }
    );

    this.results.metrics.api = apiMetrics;
  }

  async testDatabasePerformance() {
    console.log('Testing database performance...');

    const dbMetrics = {};

    // Simple query performance
    dbMetrics.simplequery = await this.measureDatabaseQuery('SELECT COUNT(*) as count FROM users');

    // Complex query with joins
    dbMetrics.complexquery = await this.measureDatabaseQuery(`
            SELECT f.id, f.name, f.area, u.email
            FROM fields f
            LEFT JOIN users u ON f.userid = u.id
            WHERE f.area > 0
            ORDER BY f.createdat DESC
            LIMIT 10
        `);

    // Spatial query (if PostGIS available)
    try {
      dbMetrics.spatialquery = await this.measureDatabaseQuery(`
                SELECT id, name, STArea(STTransform(boundary, 3857)) as aream2
                FROM fields
                WHERE boundary IS NOT NULL
                LIMIT 5
            `);
    } catch (error) {
      dbMetrics.spatialquery = {
        durationms: null,
        error: 'PostGIS not available or query failed',
      };
    }

    // Connection time
    const connStart = Date.now();
    await sequelize.authenticate();
    const connTime = Date.now() - connStart;

    dbMetrics.connection = {
      durationms: connTime,
      success: true,
    };

    this.results.metrics.database = dbMetrics;
  }

  async testSystemPerformance() {
    console.log('Testing system performance...');

    const systemMetrics = {};

    // Memory usage
    const memUsage = process.memoryUsage();
    systemMetrics.memory = {
      rss: memUsage.rss,
      heapused: memUsage.heapUsed,
      heaptotal: memUsage.heapTotal,
      external: memUsage.external,
      usagepercent: ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2),
    };

    // CPU usage (simplified)
    const cpus = os.cpus();

    systemMetrics.cpu = {
      cores: cpus.length,
      loadaverage: os.loadavg(),
      normalizedload: (os.loadavg()[0] / cpus.length).toFixed(2),
    };

    // Disk usage (simplified check)
    try {
      const stats = await fs.statvfs('/');
      const totalSpace = stats.blocks * stats.fbsize;
      const freeSpace = stats.bavail * stats.fbsize;
      const usedPercent = (((totalSpace - freeSpace) / totalSpace) * 100).toFixed(2);

      systemMetrics.disk = {
        totalgb: (totalSpace / (1024 * 1024 * 1024)).toFixed(2),
        freegb: (freeSpace / (1024 * 1024 * 1024)).toFixed(2),
        usedpercent: usedPercent,
      };
    } catch (error) {
      systemMetrics.disk = {
        error: 'Cannot determine disk usage',
      };
    }

    this.results.metrics.system = systemMetrics;
  }

  async measureAPIEndpoint(method, url, data = null, headers = {}) {
    const startTime = Date.now();

    try {
      const config = {
        method,
        url,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      const duration = Date.now() - startTime;

      return {
        durationms: duration,
        statuscode: response.status,
        success: true,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        durationms: duration,
        statuscode: error.response?.status || null,
        success: false,
        error: error.message,
      };
    }
  }

  async measureDatabaseQuery(query) {
    const startTime = Date.now();

    try {
      const [results] = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
      });
      const duration = Date.now() - startTime;

      return {
        durationms: duration,
        success: true,
        rowcount: Array.isArray(results) ? results.length : 1,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        durationms: duration,
        success: false,
        error: error.message,
      };
    }
  }

  compareAgainstThresholds() {
    const comparisons = {};

    // API comparisons
    comparisons.api = {};
    const apiKeys = Object.keys(this.results.metrics.api || {});
    for (let i = 0; i < apiKeys.length; i += 1) {
      const endpoint = apiKeys[i];
      const metrics = this.results.metrics.api[endpoint];
      let threshold = THRESHOLDS.api.general;

      if (endpoint.includes('auth')) threshold = THRESHOLDS.api.authentication;
      else if (endpoint.includes('field')) threshold = THRESHOLDS.api.fieldoperations;
      else if (endpoint.includes('health')) threshold = THRESHOLDS.api.healthdata;

      comparisons.api[endpoint] = {
        actualms: metrics.durationms,
        thresholdms: threshold,
        withinthreshold: metrics.durationms <= threshold,
        differencems: metrics.durationms - threshold,
      };
    }

    // Database comparisons
    comparisons.database = {};
    const dbKeys = Object.keys(this.results.metrics.database || {});
    for (let i = 0; i < dbKeys.length; i += 1) {
      const query = dbKeys[i];
      const metrics = this.results.metrics.database[query];
      let threshold = THRESHOLDS.database.simplequery;

      if (query === 'complexquery') threshold = THRESHOLDS.database.complexquery;
      else if (query === 'connection') threshold = THRESHOLDS.database.connection;

      comparisons.database[query] = {
        actualms: metrics.durationms,
        thresholdms: threshold,
        withinthreshold: metrics.durationms ? metrics.durationms <= threshold : null,
        differencems: metrics.durationms ? metrics.durationms - threshold : null,
      };
    }

    // System comparisons
    comparisons.system = {};
    const sysMetrics = this.results.metrics.system || {};

    if (sysMetrics.memory) {
      comparisons.system.memory = {
        actualpercent: parseFloat(sysMetrics.memory.usagepercent),
        thresholdpercent: THRESHOLDS.system.memoryusagepercent,
        withinthreshold:
          parseFloat(sysMetrics.memory.usagepercent) <= THRESHOLDS.system.memoryusagepercent,
      };
    }

    if (sysMetrics.cpu) {
      comparisons.system.cpu = {
        actualload: parseFloat(sysMetrics.cpu.normalizedload),
        thresholdload: THRESHOLDS.system.cpuload,
        withinthreshold: parseFloat(sysMetrics.cpu.normalizedload) <= THRESHOLDS.system.cpuload,
      };
    }

    if (sysMetrics.disk) {
      comparisons.system.disk = {
        actualpercent: parseFloat(sysMetrics.disk.usedpercent),
        thresholdpercent: THRESHOLDS.system.diskusagepercent,
        withinthreshold:
          parseFloat(sysMetrics.disk.usedpercent) <= THRESHOLDS.system.diskusagepercent,
      };
    }

    this.results.comparisons = comparisons;
  }

  calculateOverallStatus() {
    const allComparisons = Object.values(this.results.comparisons)
      .flatMap(cat => Object.values(cat))
      .filter(comp => comp.withinthreshold !== null);

    const failedComparisons = allComparisons.filter(comp => comp.withinthreshold === false);

    if (failedComparisons.length === 0) {
      this.results.status = 'withinthresholds';
    } else {
      this.results.status = 'thresholdsexceeded';
    }

    this.results.summary = {
      totalmeasurements: allComparisons.length,
      withinthresholds: allComparisons.filter(c => c.withinthreshold).length,
      exceededthresholds: failedComparisons.length,
      successrate:
        allComparisons.length > 0
          ? (
              (allComparisons.filter(c => c.withinthreshold).length / allComparisons.length) *
              100
            ).toFixed(1)
          : 0,
    };
  }

  async cleanupTestData() {
    try {
      if (this.testUser.email) {
        await sequelize.query('DELETE FROM users WHERE email = ?', {
          replacements: [this.testUser.email],
        });
      }
    } catch (error) {
      console.warn('Cleanup failed:', error.message);
    }
  }
}

// Run the performance baseline test
if (require.main === module) {
  const tester = new PerformanceBaselineTester();
  tester.run().catch(error => {
    console.error('Performance baseline test script failed:', error);
    process.exit(1);
  });
}

module.exports = PerformanceBaselineTester;
