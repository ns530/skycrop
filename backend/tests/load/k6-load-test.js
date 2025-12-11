/**
 * k6 Load Testing Script for SkyCrop Sprint 3 APIs
 *
 * Usage:
 *   k6 run k6-load-test
 *
 * With custom options:
 *   k6 run --vus 50 --duration 5m k6-load-test
 *
 * Requirements:
 *   - k6 installed (https://k6.io/docs/getting-started/installation/)
 *   - Backend running on localhost:3000 (or update BASEURL)
 *   - Valid JWT token (update TOKEN variable)
 *   - Valid field ID (update field_id variable)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ========== Configuration ==========

const BASEURL = ENV.BASEURL || 'http://localhost:3000';
const TOKEN = ENV.JWTTOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Replace with valid token
const field_id = ENV.field_id || 'test-field-123';

// ========== Custom Metrics ==========

const healthApiErrors = new Rate('healthapierrors');
const recommendationApiErrors = new Rate('recommendationapierrors');
const yieldApiErrors = new Rate('yieldapierrors');
const notificationApiErrors = new Rate('notificationapierrors');

const healthApiDuration = new Trend('healthapiduration');
const recommendationApiDuration = new Trend('recommendationapiduration');
const yieldApiDuration = new Trend('yieldapiduration');
const notificationApiDuration = new Trend('notificationapiduration');

const totalRequests = new Counter('totalrequests');
const successfulRequests = new Counter('successfulrequests');
const failedRequests = new Counter('failedrequests');

// ========== Test Options ==========

export let options = {
  stages: [
    { duration: '1m', target: 10 }, // Warm-up: Ramp up to 10 users
    { duration: '3m', target: 10 }, // Steady: Stay at 10 users
    { duration: '1m', target: 30 }, // Ramp: Increase to 30 users
    { duration: '3m', target: 30 }, // Peak: Stay at 30 users
    { duration: '1m', target: 50 }, // Stress: Increase to 50 users
    { duration: '2m', target: 50 }, // Stress: Stay at 50 users
    { duration: '1m', target: 0 }, // Cool-down: Ramp down to 0
  ],
  thresholds: {
    // HTTP errors should be less than 5%
    httpreqfailed: ['rate<0.05'],

    // 95th percentile response times (performance targets)
    healthapiduration: ['p(95)<500'], // <500ms for Health API
    recommendationapiduration: ['p(95)<1000'], // <1000ms for Recommendation API
    yieldapiduration: ['p(95)<1500'], // <1500ms for Yield API
    notificationapiduration: ['p(95)<100'], // <100ms for Notification API

    // Error rates should be low
    healthapierrors: ['rate<0.05'],
    recommendationapierrors: ['rate<0.10'],
    yieldapierrors: ['rate<0.10'],
    notificationapierrors: ['rate<0.01'],
  },
};

// ========== Helper Functions ==========

function getHeaders() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };
}

function logError(apiName, response) {
  console.error(
    `[${apiName}] Error: Status ${response.status}, Body: ${response.body.substring(0, 200)}`
  );
}

// ========== Test Scenarios ==========

export default function () {
  const headers = getHeaders();

  // Random scenario selection to simulate realistic traffic
  const scenario = Math.random();

  if (scenario < 0.4) {
    // 40% of requests: Health Monitoring API
    testHealthMonitoringAPI(headers);
  } else if (scenario < 0.7) {
    // 30% of requests: Recommendation Engine API
    testRecommendationAPI(headers);
  } else if (scenario < 0.85) {
    // 15% of requests: Yield Prediction API
    testYieldPredictionAPI(headers);
  } else {
    // 15% of requests: Notification Service API
    testNotificationAPI(headers);
  }

  // Think time: Simulate user reading response
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

// ========== API Test Functions ==========

function testHealthMonitoringAPI(headers) {
  const startTime = Date.now();

  // GET /api/v1/fields/{field_id}/health/history
  const response = http.get(
    `${BASEURL}/api/v1/fields/${field_id}/health/history?start=2024-01-01&end=2024-01-31`,
    { headers: headers }
  );

  const duration = Date.now() - startTime;
  healthApiDuration.add(duration);
  totalRequests.add(1);

  const success = check(response, {
    'Health API: status 200 or 404': r => r.status === 200 || r.status === 404,
    'Health API: has success field': r => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('success');
      } catch (e) {
        return false;
      }
    },
    'Health API: response time < 500ms': r => r.timings.duration < 500,
  });

  if (!success) {
    healthApiErrors.add(1);
    failedRequests.add(1);
    logError('Health API', response);
  } else {
    successfulRequests.add(1);
  }
}

function testRecommendationAPI(headers) {
  const startTime = Date.now();

  // GET /api/v1/fields/{field_id}/recommendations
  const response = http.get(
    `${BASEURL}/api/v1/fields/${field_id}/recommendations?page=1&pageSize=10&status=pending`,
    { headers: headers }
  );

  const duration = Date.now() - startTime;
  recommendationApiDuration.add(duration);
  totalRequests.add(1);

  const success = check(response, {
    'Recommendation API: status 200 or 404': r => r.status === 200 || r.status === 404,
    'Recommendation API: has success field': r => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('success');
      } catch (e) {
        return false;
      }
    },
    'Recommendation API: response time < 1000ms': r => r.timings.duration < 1000,
  });

  if (!success) {
    recommendationApiErrors.add(1);
    failedRequests.add(1);
    logError('Recommendation API', response);
  } else {
    successfulRequests.add(1);
  }
}

function testYieldPredictionAPI(headers) {
  const startTime = Date.now();

  // GET /api/v1/fields/{field_id}/yield/predictions
  const response = http.get(
    `${BASEURL}/api/v1/fields/${field_id}/yield/predictions?limit=5&sort=predictiondate&order=desc`,
    { headers: headers }
  );

  const duration = Date.now() - startTime;
  yieldApiDuration.add(duration);
  totalRequests.add(1);

  const success = check(response, {
    'Yield API: status 200 or 404': r => r.status === 200 || r.status === 404,
    'Yield API: has success field': r => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('success');
      } catch (e) {
        return false;
      }
    },
    'Yield API: response time < 1500ms': r => r.timings.duration < 1500,
  });

  if (!success) {
    yieldApiErrors.add(1);
    failedRequests.add(1);
    logError('Yield API', response);
  } else {
    successfulRequests.add(1);
  }
}

function testNotificationAPI(headers) {
  const startTime = Date.now();

  // GET /api/v1/notifications/queue/stats
  const response = http.get(`${BASEURL}/api/v1/notifications/queue/stats`, { headers: headers });

  const duration = Date.now() - startTime;
  notificationApiDuration.add(duration);
  totalRequests.add(1);

  const success = check(response, {
    'Notification API: status 200': r => r.status === 200,
    'Notification API: has data': r => {
      try {
        const body = JSON.parse(r.body);
        return body.success && body.hasOwnProperty('data');
      } catch (e) {
        return false;
      }
    },
    'Notification API: response time < 100ms': r => r.timings.duration < 100,
  });

  if (!success) {
    notificationApiErrors.add(1);
    failedRequests.add(1);
    logError('Notification API', response);
  } else {
    successfulRequests.add(1);
  }
}

// ========== Summary Handler ==========

export function handleSummary(data) {
  console.log('\n========================================');
  console.log('📊 SkyCrop Load Test Summary');
  console.log('========================================\n');

  console.log(`Total Requests: ${data.metrics.totalrequests.values.count}`);
  console.log(`Successful: ${data.metrics.successfulrequests.values.count}`);
  console.log(`Failed: ${data.metrics.failedrequests.values.count}`);
  console.log(
    `Success Rate: ${((data.metrics.successfulrequests.values.count / data.metrics.totalrequests.values.count) * 100).toFixed(2)}%\n`
  );

  console.log('Performance Metrics (p95):');
  console.log(`  Health API: ${data.metrics.healthapiduration.values['p(95)'].toFixed(2)}ms`);
  console.log(
    `  Recommendation API: ${data.metrics.recommendationapiduration.values['p(95)'].toFixed(2)}ms`
  );
  console.log(`  Yield API: ${data.metrics.yieldapiduration.values['p(95)'].toFixed(2)}ms`);
  console.log(
    `  Notification API: ${data.metrics.notificationapiduration.values['p(95)'].toFixed(2)}ms\n`
  );

  console.log('Error Rates:');
  console.log(`  Health API: ${(data.metrics.healthapierrors.values.rate * 100).toFixed(2)}%`);
  console.log(
    `  Recommendation API: ${(data.metrics.recommendationapierrors.values.rate * 100).toFixed(2)}%`
  );
  console.log(`  Yield API: ${(data.metrics.yieldapierrors.values.rate * 100).toFixed(2)}%`);
  console.log(
    `  Notification API: ${(data.metrics.notificationapierrors.values.rate * 100).toFixed(2)}%\n`
  );

  console.log('========================================\n');

  return {
    stdout: JSON.stringify(data, null, 2),
    'summaryon': JSON.stringify(data, null, 2),
  };
}
