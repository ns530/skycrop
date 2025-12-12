import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const healthUpdateSuccessRate = new Rate('healthupdatesuccess');
const healthUpdateDuration = new Trend('healthupdateduration');

// Test configuration
export const options = {
  scenarios: {
    dailyhealthupdate: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 50 }, // Ramp up to moderate load
        { duration: '10m', target: 500 }, // Sustained load - 500 concurrent health updates
        { duration: '2m', target: 50 }, // Ramp down
        { duration: '1m', target: 0 }, // Cool down
      ],
      tags: { testtype: 'dailyhealthupdate' },
    },
  },
  thresholds: {
    httpreqduration: ['p(95)<10000'], // 95% of requests should be below 10s
    httpreqfailed: ['rate<0.05'], // Error rate should be below 5%
    healthupdatesuccess: ['rate>0.95'], // 95% success rate
    healthupdateduration: ['p(95)<15000'], // 95% under 15s
  },
};

// Base URL from environment
const BASEURL = ENV.BASEURL || 'http://localhost:3000/api/v1';

// Setup function - create test fields
export function setup() {
  console.log('Setting up test fields for health update load test...');

  // Create test user
  const userData = {
    email: `healthtest_${new Date().getTime()}@skycrop.test`,
    password: 'TestPass123!',
    name: 'Health Test User',
  };

  const registerResponse = http.post(`${BASEURL}/auth/register`, JSON.stringify(userData), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (registerResponse.status !== 201) {
    console.error('Test user registration failed');
    return;
  }

  const loginResponse = http.post(
    `${BASEURL}/auth/login`,
    JSON.stringify({
      email: userData.email,
      password: userData.password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (loginResponse.status !== 200) {
    console.error('Test user login failed');
    return;
  }

  const { token } = loginResponseon();

  // Create multiple test fields
  const testFields = [];
  const coordinates = [
    { lat: 7.8731, lng: 80.7718 }, // Anuradhapura
    { lat: 8.3114, lng: 80.4037 }, // Vavuniya
    { lat: 7.2906, lng: 80.6337 }, // Kandy
    { lat: 6.0535, lng: 80.221 }, // Galle
    { lat: 7.957, lng: 80.7603 }, // Polonnaruwa
  ];

  for (let i = 0; i < 10; i++) {
    // Create 10 test fields
    const coords = coordinates[i % coordinates.length];
    const fieldData = {
      latitude: coords.lat + (Math.random() - 0.5) * 0.01, // Add small random offset
      longitude: coords.lng + (Math.random() - 0.5) * 0.01,
    };

    const boundaryResponse = http.post(
      `${BASEURL}/fields/detect-boundary`,
      JSON.stringify(fieldData),
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: '70s',
      }
    );

    if (boundaryResponse.status === 200) {
      const fieldResponse = http.post(
        `${BASEURL}/fields`,
        JSON.stringify({
          name: `Test Field ${i + 1}`,
          boundary: boundaryResponseon().boundary,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (fieldResponse.status === 201) {
        testFields.push(fieldResponseon().field.id);
        console.log(`Created test field ${i + 1}`);
      }
    }

    sleep(2); // Delay between field creations
  }

  console.log(`Created ${testFields.length} test fields`);
  return { token, testFields };
}

// Main test function
export default function (data) {
  const { token } = data;
  const { testFields } = data;

  if (!testFields || testFields.length === 0) {
    console.error('No test fields available');
    return;
  }

  // Select random field
  const field_id = testFields[Math.floor(Math.random() * testFields.length)];

  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeout: '20s',
  };

  const startTime = new Date().getTime();

  // Request health data update
  const healthResponse = http.post(`${BASEURL}/fields/${field_id}/update-health`, {}, params);

  const endTime = new Date().getTime();
  const duration = endTime - startTime;

  // Record custom metrics
  healthUpdateDuration.add(duration);

  // Check health update success
  const healthSuccess = check(healthResponse, {
    'health update status is 200': r => r.status === 200,
    'health update response has health data': r => ron().hasOwnProperty('health'),
    'health update completes within 15 seconds': r => r.timings.duration < 15000,
    'health data has NDVI': r => ron().health.hasOwnProperty('ndvi'),
    'health data has status': r => ron().health.hasOwnProperty('status'),
  });

  healthUpdateSuccessRate.add(healthSuccess);

  // Log failures for debugging
  if (!healthSuccess) {
    console.log(
      `Health update failed for field ${field_id}: ${healthResponse.status} - ${healthResponse.body}`
    );
  }

  // Moderate delay between requests
  sleep(Math.random() * 3 + 2); // 2-5 second random delay
}

// Teardown function
export function teardown(data) {
  console.log('Daily health update load test completed');
}
