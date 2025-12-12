import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const registrationSuccessRate = new Rate('registrationsuccess');
const registrationDuration = new Trend('registrationduration');

// Test configuration
export const options = {
  scenarios: {
    userregistrationpeak: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 10 }, // Warm up
        { duration: '2m', target: 50 }, // Ramp up to moderate load
        { duration: '3m', target: 100 }, // Peak load - 100 concurrent registrations
        { duration: '2m', target: 50 }, // Ramp down
        { duration: '1m', target: 0 }, // Cool down
      ],
      tags: { testtype: 'registrationpeak' },
    },
  },
  thresholds: {
    httpreqduration: ['p(95)<2000'], // 95% of requests should be below 2s
    httpreqfailed: ['rate<0.1'], // Error rate should be below 10%
    registrationsuccess: ['rate>0.95'], // 95% registration success rate
    registrationduration: ['p(95)<3000'], // 95% of registrations under 3s
  },
};

// Base URL from environment
const BASEURL = ENV.BASEURL || 'http://localhost:3000/api/v1';

// Test data generation
function generateUserData() {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 10000);

  return {
    email: `testuser_${timestamp}_${randomNum}@skycrop.test`,
    password: 'TestPass123!',
    name: `Test User ${randomNum}`,
    phone: `+9477123${String(randomNum).padStart(4, '0')}`,
  };
}

// Setup function - runs before the test
export function setup() {
  // Verify API is accessible
  const response = http.get(`${BASEURL}/health`);
  if (response.status !== 200) {
    console.error('API health check failed');
    return;
  }

  console.log('API health check passed');
  return {};
}

// Main test function
export default function (_data) {
  const userData = generateUserData();

  const payload = JSON.stringify({
    email: userData.email,
    password: userData.password,
    name: userData.name,
    phone: userData.phone,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const startTime = new Date().getTime();

  // Register user
  const registerResponse = http.post(`${BASEURL}/auth/register`, payload, params);

  const endTime = new Date().getTime();
  const duration = endTime - startTime;

  // Record custom metrics
  registrationDuration.add(duration);

  // Check registration success
  const registrationSuccess = check(registerResponse, {
    'registration status is 201': r => r.status === 201,
    'registration response has user data': r =>
      Object.prototype.hasOwnProperty.call(r.json(), 'user'),
    'registration response has token': r => Object.prototype.hasOwnProperty.call(r.json(), 'token'),
    'registration completes within 3 seconds': r => r.timings.duration < 3000,
  });

  registrationSuccessRate.add(registrationSuccess);

  // Log failures for debugging
  if (!registrationSuccess) {
    console.log(`Registration failed: ${registerResponse.status} - ${registerResponse.body}`);
  }

  // Small delay between requests to simulate realistic user behavior
  sleep(Math.random() * 2 + 1); // 1-3 second random delay
}

// Teardown function - runs after the test
export function teardown(_data) {
  console.log('User registration peak load test completed');
}
