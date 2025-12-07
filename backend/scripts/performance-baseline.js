#!/usr/bin/env node

/**
 * SkyCrop Performance Baseline Script
 * Establishes and validates performance benchmarks
 * Measures API response times, database performance, and system resources
 */

const axios = require('axios');
const os = require('os');
const { sequelize } = require('../src/config/database.config');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

// Performance thresholds from test plans
const THRESHOLDS = {
    api: {
        authentication: 1000,      // <1 second
        field_operations: 2000,    // <2 seconds
        health_data: 3000,         // <3 seconds
        image_processing: 60000,   // <60 seconds
        general: 2000              // <2 seconds general API
    },
    database: {
        simple_query: 100,         // <100ms
        complex_query: 500,        // <500ms
        connection: 1000           // <1 second
    },
    system: {
        memory_usage_percent: 80,  // <80%
        cpu_load: 1.0,             // <100% normalized
        disk_usage_percent: 85     // <85%
    }
};

class PerformanceBaselineTester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            status: 'unknown',
            benchmarks: {},
            metrics: {},
            comparisons: {},
            summary: {}
        };
        this.authToken = null;
        this.testUser = {
            email: `perf-test-${Date.now()}@example.com`,
            password: 'PerfTest123!',
            firstName: 'Perf',
            lastName: 'Test'
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
        const registerResponse = await axios.post(`${API_BASE}/auth/register`, this.testUser, {
            timeout: 10000
        });

        // Login to get token
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: this.testUser.email,
            password: this.testUser.password
        }, {
            timeout: 10000
        });

        this.authToken = loginResponse.data.token;

        // Create test field
        const fieldData = {
            name: 'Performance Test Field',
            boundary: {
                type: 'Polygon',
                coordinates: [[
                    [80.123, 6.123],
                    [80.456, 6.123],
                    [80.456, 6.456],
                    [80.123, 6.456],
                    [80.123, 6.123]
                ]]
            },
            area: 25.5,
            cropType: 'paddy'
        };

        const fieldResponse = await axios.post(`${API_BASE}/fields`, fieldData, {
            headers: { 'Authorization': `Bearer ${this.authToken}` },
            timeout: 10000
        });

        this.testField = fieldResponse.data.field;
    }

    async testAPIPerformance() {
        console.log('Testing API performance...');

        const apiMetrics = {};

        // Authentication endpoints
        apiMetrics.auth_register = await this.measureAPIEndpoint(
            'POST', `${API_BASE}/auth/register`,
            {
                email: `temp-${Date.now()}@example.com`,
                password: 'TempPass123!',
                firstName: 'Temp',
                lastName: 'User'
            }
        );

        apiMetrics.auth_login = await this.measureAPIEndpoint(
            'POST', `${API_BASE}/auth/login`,
            { email: this.testUser.email, password: this.testUser.password }
        );

        // Field operations
        apiMetrics.field_create = await this.measureAPIEndpoint(
            'POST', `${API_BASE}/fields`,
            {
                name: 'Temp Field',
                boundary: {
                    type: 'Polygon',
                    coordinates: [[[80.1, 6.1], [80.2, 6.1], [80.2, 6.2], [80.1, 6.2], [80.1, 6.1]]]
                },
                area: 10.0,
                cropType: 'paddy'
            },
            { 'Authorization': `Bearer ${this.authToken}` }
        );

        apiMetrics.field_get = await this.measureAPIEndpoint(
            'GET', `${API_BASE}/fields/${this.testField.id}`,
            null,
            { 'Authorization': `Bearer ${this.authToken}` }
        );

        apiMetrics.field_list = await this.measureAPIEndpoint(
            'GET', `${API_BASE}/fields`,
            null,
            { 'Authorization': `Bearer ${this.authToken}` }
        );

        // Health data operations
        apiMetrics.health_history = await this.measureAPIEndpoint(
            'GET', `${API_BASE}/fields/${this.testField.id}/health/history?start=2024-01-01&end=2024-12-31`,
            null,
            { 'Authorization': `Bearer ${this.authToken}` }
        );

        // Recommendation operations
        apiMetrics.recommendations_get = await this.measureAPIEndpoint(
            'GET', `${API_BASE}/fields/${this.testField.id}/recommendations`,
            null,
            { 'Authorization': `Bearer ${this.authToken}` }
        );

        this.results.metrics.api = apiMetrics;
    }

    async testDatabasePerformance() {
        console.log('Testing database performance...');

        const dbMetrics = {};

        // Simple query performance
        dbMetrics.simple_query = await this.measureDatabaseQuery(
            'SELECT COUNT(*) as count FROM users'
        );

        // Complex query with joins
        dbMetrics.complex_query = await this.measureDatabaseQuery(`
            SELECT f.id, f.name, f.area, u.email
            FROM fields f
            LEFT JOIN users u ON f.user_id = u.id
            WHERE f.area > 0
            ORDER BY f.created_at DESC
            LIMIT 10
        `);

        // Spatial query (if PostGIS available)
        try {
            dbMetrics.spatial_query = await this.measureDatabaseQuery(`
                SELECT id, name, ST_Area(ST_Transform(boundary, 3857)) as area_m2
                FROM fields
                WHERE boundary IS NOT NULL
                LIMIT 5
            `);
        } catch (error) {
            dbMetrics.spatial_query = {
                duration_ms: null,
                error: 'PostGIS not available or query failed'
            };
        }

        // Connection time
        const connStart = Date.now();
        const testConn = await sequelize.authenticate();
        const connTime = Date.now() - connStart;

        dbMetrics.connection = {
            duration_ms: connTime,
            success: true
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
            heap_used: memUsage.heapUsed,
            heap_total: memUsage.heapTotal,
            external: memUsage.external,
            usage_percent: (memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(2)
        };

        // CPU usage (simplified)
        const cpus = os.cpus();
        const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
        const totalTick = cpus.reduce((acc, cpu) => acc + Object.values(cpu.times).reduce((a, b) => a + b), 0);
        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;

        systemMetrics.cpu = {
            cores: cpus.length,
            load_average: os.loadavg(),
            normalized_load: (os.loadavg()[0] / cpus.length).toFixed(2)
        };

        // Disk usage (simplified check)
        try {
            const fs = require('fs').promises;
            const stats = await fs.statvfs('/');
            const totalSpace = stats.blocks * stats.f_bsize;
            const freeSpace = stats.bavail * stats.f_bsize;
            const usedPercent = ((totalSpace - freeSpace) / totalSpace * 100).toFixed(2);

            systemMetrics.disk = {
                total_gb: (totalSpace / (1024 * 1024 * 1024)).toFixed(2),
                free_gb: (freeSpace / (1024 * 1024 * 1024)).toFixed(2),
                used_percent: usedPercent
            };
        } catch (error) {
            systemMetrics.disk = {
                error: 'Cannot determine disk usage'
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
                    ...headers
                }
            };

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            const duration = Date.now() - startTime;

            return {
                duration_ms: duration,
                status_code: response.status,
                success: true
            };
        } catch (error) {
            const duration = Date.now() - startTime;

            return {
                duration_ms: duration,
                status_code: error.response?.status || null,
                success: false,
                error: error.message
            };
        }
    }

    async measureDatabaseQuery(query) {
        const startTime = Date.now();

        try {
            const [results] = await sequelize.query(query, {
                type: sequelize.QueryTypes.SELECT
            });
            const duration = Date.now() - startTime;

            return {
                duration_ms: duration,
                success: true,
                row_count: Array.isArray(results) ? results.length : 1
            };
        } catch (error) {
            const duration = Date.now() - startTime;

            return {
                duration_ms: duration,
                success: false,
                error: error.message
            };
        }
    }

    compareAgainstThresholds() {
        const comparisons = {};

        // API comparisons
        comparisons.api = {};
        for (const [endpoint, metrics] of Object.entries(this.results.metrics.api || {})) {
            let threshold = THRESHOLDS.api.general;

            if (endpoint.includes('auth')) threshold = THRESHOLDS.api.authentication;
            else if (endpoint.includes('field')) threshold = THRESHOLDS.api.field_operations;
            else if (endpoint.includes('health')) threshold = THRESHOLDS.api.health_data;

            comparisons.api[endpoint] = {
                actual_ms: metrics.duration_ms,
                threshold_ms: threshold,
                within_threshold: metrics.duration_ms <= threshold,
                difference_ms: metrics.duration_ms - threshold
            };
        }

        // Database comparisons
        comparisons.database = {};
        for (const [query, metrics] of Object.entries(this.results.metrics.database || {})) {
            let threshold = THRESHOLDS.database.simple_query;

            if (query === 'complex_query') threshold = THRESHOLDS.database.complex_query;
            else if (query === 'connection') threshold = THRESHOLDS.database.connection;

            comparisons.database[query] = {
                actual_ms: metrics.duration_ms,
                threshold_ms: threshold,
                within_threshold: metrics.duration_ms ? metrics.duration_ms <= threshold : null,
                difference_ms: metrics.duration_ms ? metrics.duration_ms - threshold : null
            };
        }

        // System comparisons
        comparisons.system = {};
        const sysMetrics = this.results.metrics.system || {};

        if (sysMetrics.memory) {
            comparisons.system.memory = {
                actual_percent: parseFloat(sysMetrics.memory.usage_percent),
                threshold_percent: THRESHOLDS.system.memory_usage_percent,
                within_threshold: parseFloat(sysMetrics.memory.usage_percent) <= THRESHOLDS.system.memory_usage_percent
            };
        }

        if (sysMetrics.cpu) {
            comparisons.system.cpu = {
                actual_load: parseFloat(sysMetrics.cpu.normalized_load),
                threshold_load: THRESHOLDS.system.cpu_load,
                within_threshold: parseFloat(sysMetrics.cpu.normalized_load) <= THRESHOLDS.system.cpu_load
            };
        }

        if (sysMetrics.disk) {
            comparisons.system.disk = {
                actual_percent: parseFloat(sysMetrics.disk.used_percent),
                threshold_percent: THRESHOLDS.system.disk_usage_percent,
                within_threshold: parseFloat(sysMetrics.disk.used_percent) <= THRESHOLDS.system.disk_usage_percent
            };
        }

        this.results.comparisons = comparisons;
    }

    calculateOverallStatus() {
        const allComparisons = Object.values(this.results.comparisons)
            .flatMap(cat => Object.values(cat))
            .filter(comp => comp.within_threshold !== null);

        const failedComparisons = allComparisons.filter(comp => comp.within_threshold === false);

        if (failedComparisons.length === 0) {
            this.results.status = 'within_thresholds';
        } else {
            this.results.status = 'thresholds_exceeded';
        }

        this.results.summary = {
            total_measurements: allComparisons.length,
            within_thresholds: allComparisons.filter(c => c.within_threshold).length,
            exceeded_thresholds: failedComparisons.length,
            success_rate: allComparisons.length > 0 ?
                ((allComparisons.filter(c => c.within_threshold).length / allComparisons.length) * 100).toFixed(1) : 0
        };
    }

    async cleanupTestData() {
        try {
            if (this.testUser.email) {
                await sequelize.query(
                    'DELETE FROM users WHERE email = ?',
                    { replacements: [this.testUser.email] }
                );
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