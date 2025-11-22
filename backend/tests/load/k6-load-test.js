/**
 * k6 Load Testing Script for SkyCrop Sprint 3 APIs
 * 
 * Usage:
 *   k6 run k6-load-test.js
 * 
 * With custom options:
 *   k6 run --vus 50 --duration 5m k6-load-test.js
 * 
 * Requirements:
 *   - k6 installed (https://k6.io/docs/getting-started/installation/)
 *   - Backend running on localhost:3000 (or update BASE_URL)
 *   - Valid JWT token (update TOKEN variable)
 *   - Valid field ID (update FIELD_ID variable)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ========== Configuration ==========

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TOKEN = __ENV.JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Replace with valid token
const FIELD_ID = __ENV.FIELD_ID || 'test-field-123';

// ========== Custom Metrics ==========

const healthApiErrors = new Rate('health_api_errors');
const recommendationApiErrors = new Rate('recommendation_api_errors');
const yieldApiErrors = new Rate('yield_api_errors');
const notificationApiErrors = new Rate('notification_api_errors');

const healthApiDuration = new Trend('health_api_duration');
const recommendationApiDuration = new Trend('recommendation_api_duration');
const yieldApiDuration = new Trend('yield_api_duration');
const notificationApiDuration = new Trend('notification_api_duration');

const totalRequests = new Counter('total_requests');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// ========== Test Options ==========

export let options = {
  stages: [
    { duration: '1m', target: 10 },   // Warm-up: Ramp up to 10 users
    { duration: '3m', target: 10 },   // Steady: Stay at 10 users
    { duration: '1m', target: 30 },   // Ramp: Increase to 30 users
    { duration: '3m', target: 30 },   // Peak: Stay at 30 users
    { duration: '1m', target: 50 },   // Stress: Increase to 50 users
    { duration: '2m', target: 50 },   // Stress: Stay at 50 users
    { duration: '1m', target: 0 },    // Cool-down: Ramp down to 0
  ],
  thresholds: {
    // HTTP errors should be less than 5%
    'http_req_failed': ['rate<0.05'],
    
    // 95th percentile response times (performance targets)
    'health_api_duration': ['p(95)<500'],           // <500ms for Health API
    'recommendation_api_duration': ['p(95)<1000'],  // <1000ms for Recommendation API
    'yield_api_duration': ['p(95)<1500'],           // <1500ms for Yield API
    'notification_api_duration': ['p(95)<100'],     // <100ms for Notification API
    
    // Error rates should be low
    'health_api_errors': ['rate<0.05'],
    'recommendation_api_errors': ['rate<0.10'],
    'yield_api_errors': ['rate<0.10'],
    'notification_api_errors': ['rate<0.01'],
  },
};

// ========== Helper Functions ==========

function getHeaders() {
  return {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };
}

function logError(apiName, response) {
  console.error(`[${apiName}] Error: Status ${response.status}, Body: ${response.body.substring(0, 200)}`);
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
  
  // GET /api/v1/fields/{fieldId}/health/history
  const response = http.get(
    `${BASE_URL}/api/v1/fields/${FIELD_ID}/health/history?start=2024-01-01&end=2024-01-31`,
    { headers: headers }
  );
  
  const duration = Date.now() - startTime;
  healthApiDuration.add(duration);
  totalRequests.add(1);
  
  const success = check(response, {
    'Health API: status 200 or 404': (r) => r.status === 200 || r.status === 404,
    'Health API: has success field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('success');
      } catch (e) {
        return false;
      }
    },
    'Health API: response time < 500ms': (r) => r.timings.duration < 500,
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
  
  // GET /api/v1/fields/{fieldId}/recommendations
  const response = http.get(
    `${BASE_URL}/api/v1/fields/${FIELD_ID}/recommendations?page=1&pageSize=10&status=pending`,
    { headers: headers }
  );
  
  const duration = Date.now() - startTime;
  recommendationApiDuration.add(duration);
  totalRequests.add(1);
  
  const success = check(response, {
    'Recommendation API: status 200 or 404': (r) => r.status === 200 || r.status === 404,
    'Recommendation API: has success field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('success');
      } catch (e) {
        return false;
      }
    },
    'Recommendation API: response time < 1000ms': (r) => r.timings.duration < 1000,
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
  
  // GET /api/v1/fields/{fieldId}/yield/predictions
  const response = http.get(
    `${BASE_URL}/api/v1/fields/${FIELD_ID}/yield/predictions?limit=5&sort=prediction_date&order=desc`,
    { headers: headers }
  );
  
  const duration = Date.now() - startTime;
  yieldApiDuration.add(duration);
  totalRequests.add(1);
  
  const success = check(response, {
    'Yield API: status 200 or 404': (r) => r.status === 200 || r.status === 404,
    'Yield API: has success field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('success');
      } catch (e) {
        return false;
      }
    },
    'Yield API: response time < 1500ms': (r) => r.timings.duration < 1500,
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
  const response = http.get(
    `${BASE_URL}/api/v1/notifications/queue/stats`,
    { headers: headers }
  );
  
  const duration = Date.now() - startTime;
  notificationApiDuration.add(duration);
  totalRequests.add(1);
  
  const success = check(response, {
    'Notification API: status 200': (r) => r.status === 200,
    'Notification API: has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success && body.hasOwnProperty('data');
      } catch (e) {
        return false;
      }
    },
    'Notification API: response time < 100ms': (r) => r.timings.duration < 100,
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
  
  console.log(`Total Requests: ${data.metrics.total_requests.values.count}`);
  console.log(`Successful: ${data.metrics.successful_requests.values.count}`);
  console.log(`Failed: ${data.metrics.failed_requests.values.count}`);
  console.log(`Success Rate: ${((data.metrics.successful_requests.values.count / data.metrics.total_requests.values.count) * 100).toFixed(2)}%\n`);
  
  console.log('Performance Metrics (p95):');
  console.log(`  Health API: ${data.metrics.health_api_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`  Recommendation API: ${data.metrics.recommendation_api_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`  Yield API: ${data.metrics.yield_api_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`  Notification API: ${data.metrics.notification_api_duration.values['p(95)'].toFixed(2)}ms\n`);
  
  console.log('Error Rates:');
  console.log(`  Health API: ${(data.metrics.health_api_errors.values.rate * 100).toFixed(2)}%`);
  console.log(`  Recommendation API: ${(data.metrics.recommendation_api_errors.values.rate * 100).toFixed(2)}%`);
  console.log(`  Yield API: ${(data.metrics.yield_api_errors.values.rate * 100).toFixed(2)}%`);
  console.log(`  Notification API: ${(data.metrics.notification_api_errors.values.rate * 100).toFixed(2)}%\n`);
  
  console.log('========================================\n');
  
  return {
    'stdout': JSON.stringify(data, null, 2),
    'summary.json': JSON.stringify(data, null, 2),
  };
}

