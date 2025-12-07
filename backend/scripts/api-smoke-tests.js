#!/usr/bin/env node

/**
 * SkyCrop API Smoke Tests
 * Validates core API functionality for deployment readiness
 * Tests authentication, field operations, health data, and recommendations
 */

const axios = require('axios');
const { sequelize } = require('../src/config/database.config');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

class APISmokeTester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            status: 'unknown',
            tests: [],
            summary: {}
        };
        this.authToken = null;
        this.testUser = {
            email: `smoke-test-${Date.now()}@example.com`,
            password: 'SmokeTest123!',
            firstName: 'Smoke',
            lastName: 'Test'
        };
        this.testField = null;
    }

    async run() {
        console.log('🧪 Running SkyCrop API Smoke Tests...');

        try {
            // Clean up any existing test data first
            await this.cleanup();

            // Run test suites
            await this.testAuthentication();
            await this.testFieldOperations();
            await this.testHealthData();
            await this.testRecommendations();

            // Calculate results
            this.calculateResults();

            // Output results
            console.log(JSON.stringify(this.results, null, 2));

            // Exit with appropriate code
            process.exit(this.results.status === 'passed' ? 0 : 1);

        } catch (error) {
            this.results.status = 'error';
            this.results.error = error.message;
            console.error('API smoke tests failed:', error.message);
            console.log(JSON.stringify(this.results, null, 2));
            process.exit(1);
        } finally {
            await this.cleanup();
        }
    }

    async testAuthentication() {
        console.log('Testing Authentication endpoints...');

        // Test user registration
        await this.runTest('User Registration', async () => {
            const response = await axios.post(`${API_BASE}/auth/register`, this.testUser, {
                timeout: 10000
            });

            if (response.status !== 201) {
                throw new Error(`Expected 201, got ${response.status}`);
            }

            return { userId: response.data.user.id };
        });

        // Test user login
        await this.runTest('User Login', async () => {
            const response = await axios.post(`${API_BASE}/auth/login`, {
                email: this.testUser.email,
                password: this.testUser.password
            }, {
                timeout: 10000
            });

            if (response.status !== 200 || !response.data.token) {
                throw new Error('Login failed or no token received');
            }

            this.authToken = response.data.token;
            return { token: this.authToken.substring(0, 20) + '...' };
        });

        // Test authentication status
        await this.runTest('Authentication Status', async () => {
            const response = await axios.get(`${API_BASE}/auth/status`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` },
                timeout: 10000
            });

            if (response.status !== 200) {
                throw new Error(`Expected 200, got ${response.status}`);
            }

            return { user: response.data.user.email };
        });
    }

    async testFieldOperations() {
        console.log('Testing Field operations...');

        const testFieldData = {
            name: 'Smoke Test Field',
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

        // Test field creation
        await this.runTest('Field Creation', async () => {
            const response = await axios.post(`${API_BASE}/fields`, testFieldData, {
                headers: { 'Authorization': `Bearer ${this.authToken}` },
                timeout: 15000
            });

            if (response.status !== 201) {
                throw new Error(`Expected 201, got ${response.status}`);
            }

            this.testField = response.data.field;
            return { fieldId: this.testField.id, name: this.testField.name };
        });

        // Test field retrieval
        await this.runTest('Field Retrieval', async () => {
            const response = await axios.get(`${API_BASE}/fields/${this.testField.id}`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` },
                timeout: 10000
            });

            if (response.status !== 200) {
                throw new Error(`Expected 200, got ${response.status}`);
            }

            if (response.data.field.id !== this.testField.id) {
                throw new Error('Retrieved field does not match created field');
            }

            return { fieldId: response.data.field.id };
        });

        // Test field listing
        await this.runTest('Field Listing', async () => {
            const response = await axios.get(`${API_BASE}/fields`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` },
                timeout: 10000
            });

            if (response.status !== 200) {
                throw new Error(`Expected 200, got ${response.status}`);
            }

            if (!Array.isArray(response.data.fields)) {
                throw new Error('Fields response should be an array');
            }

            return { count: response.data.fields.length };
        });

        // Test field update
        await this.runTest('Field Update', async () => {
            const updateData = { name: 'Updated Smoke Test Field' };
            const response = await axios.put(`${API_BASE}/fields/${this.testField.id}`, updateData, {
                headers: { 'Authorization': `Bearer ${this.authToken}` },
                timeout: 10000
            });

            if (response.status !== 200) {
                throw new Error(`Expected 200, got ${response.status}`);
            }

            if (response.data.field.name !== updateData.name) {
                throw new Error('Field name was not updated');
            }

            return { updatedName: response.data.field.name };
        });
    }

    async testHealthData() {
        console.log('Testing Health data operations...');

        // Test health data retrieval (may be empty initially)
        await this.runTest('Health Data Retrieval', async () => {
            const response = await axios.get(`${API_BASE}/fields/${this.testField.id}/health/history?start=2024-01-01&end=2024-12-31`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` },
                timeout: 15000
            });

            // Should return 200 even if no data
            if (response.status !== 200) {
                throw new Error(`Expected 200, got ${response.status}`);
            }

            return {
                dataPoints: response.data.healthData ? response.data.healthData.length : 0
            };
        });

        // Test current health status
        await this.runTest('Current Health Status', async () => {
            const response = await axios.get(`${API_BASE}/fields/${this.testField.id}/health/current`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` },
                timeout: 15000
            });

            // May return 404 if no health data exists yet
            if (response.status !== 200 && response.status !== 404) {
                throw new Error(`Expected 200 or 404, got ${response.status}`);
            }

            return {
                status: response.status === 200 ? 'data_available' : 'no_data'
            };
        });
    }

    async testRecommendations() {
        console.log('Testing Recommendation operations...');

        // Test recommendation retrieval
        await this.runTest('Recommendation Retrieval', async () => {
            const response = await axios.get(`${API_BASE}/fields/${this.testField.id}/recommendations`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` },
                timeout: 15000
            });

            // Should return 200 even if no recommendations
            if (response.status !== 200) {
                throw new Error(`Expected 200, got ${response.status}`);
            }

            return {
                count: response.data.recommendations ? response.data.recommendations.length : 0
            };
        });

        // Test recommendation generation (if endpoint exists)
        try {
            await this.runTest('Recommendation Generation', async () => {
                const response = await axios.post(`${API_BASE}/fields/${this.testField.id}/recommendations/generate`, {}, {
                    headers: { 'Authorization': `Bearer ${this.authToken}` },
                    timeout: 30000
                });

                if (response.status !== 200 && response.status !== 201) {
                    throw new Error(`Expected 200 or 201, got ${response.status}`);
                }

                return { status: 'generated' };
            });
        } catch (error) {
            // If generation endpoint doesn't exist, that's okay
            await this.runTest('Recommendation Generation', async () => {
                throw new Error('Generation endpoint not available or failed');
            });
        }
    }

    async runTest(testName, testFunction) {
        const testResult = {
            name: testName,
            status: 'unknown',
            duration: 0,
            error: null,
            data: null
        };

        const startTime = Date.now();

        try {
            testResult.data = await testFunction();
            testResult.status = 'passed';
        } catch (error) {
            testResult.status = 'failed';
            testResult.error = error.message;
        }

        testResult.duration = Date.now() - startTime;
        this.results.tests.push(testResult);

        console.log(`${testResult.status === 'passed' ? '✅' : '❌'} ${testName} (${testResult.duration}ms)`);
    }

    async cleanup() {
        try {
            // Clean up test user and field from database
            if (this.testUser.email) {
                await sequelize.query(
                    'DELETE FROM users WHERE email = ?',
                    { replacements: [this.testUser.email] }
                );
            }
            if (this.testField && this.testField.id) {
                await sequelize.query(
                    'DELETE FROM fields WHERE id = ?',
                    { replacements: [this.testField.id] }
                );
            }
        } catch (error) {
            console.warn('Cleanup failed:', error.message);
        }
    }

    calculateResults() {
        const passed = this.results.tests.filter(t => t.status === 'passed').length;
        const failed = this.results.tests.filter(t => t.status === 'failed').length;
        const total = this.results.tests.length;

        this.results.status = failed === 0 ? 'passed' : 'failed';
        this.results.summary = {
            total,
            passed,
            failed,
            success_rate: total > 0 ? ((passed / total) * 100).toFixed(1) : 0
        };
    }
}

// Run the smoke tests
if (require.main === module) {
    const tester = new APISmokeTester();
    tester.run().catch(error => {
        console.error('API smoke tests script failed:', error);
        process.exit(1);
    });
}

module.exports = APISmokeTester;