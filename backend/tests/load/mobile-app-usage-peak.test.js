import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const mobileSessionSuccessRate = new Rate('mobile_session_success');
const apiCallDuration = new Trend('api_call_duration');

// Test configuration
export const options = {
  scenarios: {
    mobile_app_usage_peak: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 20 },   // Warm up
        { duration: '3m', target: 100 },  // Ramp up to moderate load
        { duration: '5m', target: 200 },  // Peak load - 200 concurrent mobile sessions
        { duration: '3m', target: 100 },  // Ramp down
        { duration: '1m', target: 0 },    // Cool down
      ],
      tags: { test_type: 'mobile_app_usage_peak' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests should be below 3s
    http_req_failed: ['rate<0.05'],    // Error rate should be below 5%
    mobile_session_success: ['rate>0.95'], // 95% session success rate
    api_call_duration: ['p(95)<5000'], // 95% under 5s
  },
};

// Base URL from environment
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';

// Mobile user agents for realistic testing
const mobileUserAgents = [
  'SkyCrop-Mobile/1.0.0 (Android 12; Samsung Galaxy A12)',
  'SkyCrop-Mobile/1.0.0 (Android 11; Xiaomi Redmi Note 9)',
  'SkyCrop-Mobile/1.0.0 (iOS 15.0; iPhone 12)',
  'SkyCrop-Mobile/1.0.0 (iOS 14.0; iPhone 11)',
];

// Setup function - create test users and fields
export function setup() {
  console.log('Setting up test users and fields for mobile app usage test...');

  const testUsers = [];
  const testFields = [];

  // Create 10 test users with fields
  for (let i = 0; i < 10; i++) {
    const userData = {
      email: `mobiletest_${new Date().getTime()}_${i}@skycrop.test`,
      password: 'TestPass123!',
      name: `Mobile Test User ${i}`,
    };

    const registerResponse = http.post(`${BASE_URL}/auth/register`, JSON.stringify(userData), {
      headers: { 'Content-Type': 'application/json' },
    });

    if (registerResponse.status === 201) {
      const loginResponse = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
        email: userData.email,
        password: userData.password,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });

      if (loginResponse.status === 200) {
        const token = loginResponse.json().token;
        testUsers.push({ email: userData.email, token });

        // Create a field for this user
        const coords = { lat: 7.8731 + (Math.random() - 0.5) * 0.1, lng: 80.7718 + (Math.random() - 0.5) * 0.1 };

        const boundaryResponse = http.post(`${BASE_URL}/fields/detect-boundary`, JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lng,
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          timeout: '70s',
        });

        if (boundaryResponse.status === 200) {
          const fieldResponse = http.post(`${BASE_URL}/fields`, JSON.stringify({
            name: `Mobile Field ${i + 1}`,
            boundary: boundaryResponse.json().boundary,
          }), {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          if (fieldResponse.status === 201) {
            testFields.push({
              userEmail: userData.email,
              fieldId: fieldResponse.json().field.id,
              token: token,
            });
          }
        }
      }
    }

    sleep(1); // Delay between user creations
  }

  console.log(`Created ${testUsers.length} test users and ${testFields.length} test fields`);
  return { testUsers, testFields };
}

// Main test function - simulate mobile app usage patterns
export default function (data) {
  const testFields = data.testFields;

  if (!testFields || testFields.length === 0) {
    console.error('No test fields available');
    return;
  }

  // Select random field and user
  const testField = testFields[Math.floor(Math.random() * testFields.length)];
  const token = testField.token;
  const fieldId = testField.fieldId;

  // Random mobile user agent
  const userAgent = mobileUserAgents[Math.floor(Math.random() * mobileUserAgents.length)];

  const baseHeaders = {
    'Authorization': `Bearer ${token}`,
    'User-Agent': userAgent,
    'X-Platform': 'mobile',
    'X-App-Version': '1.0.0',
  };

  const startTime = new Date().getTime();

  // Simulate typical mobile app session
  let sessionSuccess = true;

  // 1. Get dashboard (field list)
  const dashboardResponse = http.get(`${BASE_URL}/fields`, {
    headers: baseHeaders,
  });

  sessionSuccess = sessionSuccess && check(dashboardResponse, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard has fields array': (r) => Array.isArray(r.json().fields),
  });

  sleep(Math.random() * 2 + 1); // 1-3 second delay

  // 2. Get field details
  const fieldResponse = http.get(`${BASE_URL}/fields/${fieldId}`, {
    headers: baseHeaders,
  });

  sessionSuccess = sessionSuccess && check(fieldResponse, {
    'field details status is 200': (r) => r.status === 200,
    'field has health data': (r) => r.json().field.hasOwnProperty('health'),
  });

  sleep(Math.random() * 1 + 0.5); // 0.5-1.5 second delay

  // 3. Get recommendations
  const recommendationsResponse = http.get(`${BASE_URL}/fields/${fieldId}/recommendations`, {
    headers: baseHeaders,
  });

  sessionSuccess = sessionSuccess && check(recommendationsResponse, {
    'recommendations status is 200': (r) => r.status === 200,
  });

  sleep(Math.random() * 1 + 0.5); // 0.5-1.5 second delay

  // 4. Get weather forecast (30% of sessions)
  if (Math.random() < 0.3) {
    const weatherResponse = http.get(`${BASE_URL}/weather/forecast?field_id=${fieldId}`, {
      headers: baseHeaders,
    });

    sessionSuccess = sessionSuccess && check(weatherResponse, {
      'weather status is 200': (r) => r.status === 200,
    });

    sleep(Math.random() * 1 + 0.5);
  }

  // 5. Get yield prediction (20% of sessions)
  if (Math.random() < 0.2) {
    const yieldResponse = http.get(`${BASE_URL}/fields/${fieldId}/yield-prediction`, {
      headers: baseHeaders,
    });

    sessionSuccess = sessionSuccess && check(yieldResponse, {
      'yield prediction status is 200': (r) => r.status === 200,
    });

    sleep(Math.random() * 1 + 0.5);
  }

  const endTime = new Date().getTime();
  const sessionDuration = endTime - startTime;

  // Record custom metrics
  apiCallDuration.add(sessionDuration);
  mobileSessionSuccessRate.add(sessionSuccess);

  // Log failures for debugging
  if (!sessionSuccess) {
    console.log(`Mobile session failed for field ${fieldId}: Incomplete session`);
  }

  // Random delay between sessions (simulating user think time)
  sleep(Math.random() * 5 + 2); // 2-7 second random delay
}

// Teardown function
export function teardown(data) {
  console.log('Mobile app usage peak load test completed');
}