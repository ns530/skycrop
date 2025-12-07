import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const boundaryDetectionSuccessRate = new Rate('boundary_detection_success');
const boundaryDetectionDuration = new Trend('boundary_detection_duration');

// Test configuration
export const options = {
  scenarios: {
    satellite_processing_peak: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 5 },    // Warm up
        { duration: '2m', target: 25 },   // Ramp up to moderate load
        { duration: '5m', target: 50 },   // Peak load - 50 concurrent boundary detections
        { duration: '2m', target: 25 },   // Ramp down
        { duration: '1m', target: 0 },    // Cool down
      ],
      tags: { test_type: 'satellite_processing_peak' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<60000'], // 95% of requests should complete within 60s
    http_req_failed: ['rate<0.1'],      // Error rate should be below 10%
    boundary_detection_success: ['rate>0.85'], // 85% success rate (matches AI accuracy)
    boundary_detection_duration: ['p(95)<60000'], // 95% under 60s
  },
};

// Base URL from environment
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';

// Sri Lankan field coordinates for testing
const testCoordinates = [
  { lat: 7.8731, lng: 80.7718 }, // Anuradhapura
  { lat: 8.3114, lng: 80.4037 }, // Vavuniya
  { lat: 7.2906, lng: 80.6337 }, // Kandy
  { lat: 6.0535, lng: 80.2210 }, // Galle
  { lat: 7.9570, lng: 80.7603 }, // Polonnaruwa
];

// Setup function
export function setup() {
  // Verify API is accessible
  const response = http.get(`${BASE_URL}/health`);
  if (response.status !== 200) {
    console.error('API health check failed');
    return;
  }

  // Create test user and get auth token
  const userData = {
    email: `loadtest_${new Date().getTime()}@skycrop.test`,
    password: 'TestPass123!',
    name: 'Load Test User',
  };

  const registerResponse = http.post(`${BASE_URL}/auth/register`, JSON.stringify(userData), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (registerResponse.status !== 201) {
    console.error('Test user registration failed');
    return;
  }

  const loginResponse = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: userData.email,
    password: userData.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginResponse.status !== 200) {
    console.error('Test user login failed');
    return;
  }

  const token = loginResponse.json().token;
  console.log('Test user authenticated successfully');

  return { token };
}

// Main test function
export default function (data) {
  const token = data.token;

  // Select random coordinates
  const coords = testCoordinates[Math.floor(Math.random() * testCoordinates.length)];

  const payload = JSON.stringify({
    latitude: coords.lat,
    longitude: coords.lng,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    timeout: '70s', // Allow up to 70 seconds for AI processing
  };

  const startTime = new Date().getTime();

  // Request boundary detection
  const boundaryResponse = http.post(`${BASE_URL}/fields/detect-boundary`, payload, params);

  const endTime = new Date().getTime();
  const duration = endTime - startTime;

  // Record custom metrics
  boundaryDetectionDuration.add(duration);

  // Check boundary detection success
  const boundarySuccess = check(boundaryResponse, {
    'boundary detection status is 200': (r) => r.status === 200,
    'boundary detection response has boundary': (r) => r.json().hasOwnProperty('boundary'),
    'boundary detection response has area': (r) => r.json().hasOwnProperty('area'),
    'boundary detection completes within 60 seconds': (r) => r.timings.duration < 60000,
    'boundary area is valid': (r) => {
      const area = r.json().area;
      return area >= 0.1 && area <= 50; // Valid hectare range
    },
  });

  boundaryDetectionSuccessRate.add(boundarySuccess);

  // Log failures for debugging
  if (!boundarySuccess) {
    console.log(`Boundary detection failed: ${boundaryResponse.status} - ${boundaryResponse.body}`);
  }

  // Longer delay between requests due to AI processing time
  sleep(Math.random() * 5 + 3); // 3-8 second random delay
}

// Teardown function
export function teardown(data) {
  console.log('Satellite processing peak load test completed');
}