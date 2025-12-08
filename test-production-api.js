#!/usr/bin/env node

/**
 * Test Production API Endpoints
 * Tests the deployed SkyCrop backend API
 */

const BASE_URL = 'https://backend-production-9e94.up.railway.app';
const API_BASE = `${BASE_URL}/api/v1`;

async function testEndpoint(name, method, endpoint, expectedStatus = 200, headers = {}, data = null) {
  console.log(`Testing: ${name}`);

  try {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const responseText = await response.text();

    if (response.status === expectedStatus) {
      console.log(`✅ PASS: ${name} (Status: ${response.status})`);
      return { success: true, status: response.status, data: responseText };
    } else {
      console.log(`❌ FAIL: ${name} (Expected: ${expectedStatus}, Got: ${response.status})`);
      console.log(`Response: ${responseText}`);
      return { success: false, status: response.status, data: responseText };
    }
  } catch (error) {
    console.log(`❌ ERROR: ${name} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing SkyCrop Production API...\n');

  let authToken = null;
  let testUserEmail = `test-${Date.now()}@example.com`;

  // Test 1: Health Check
  console.log('=========================================');
  console.log('Test Suite 1: Core Endpoints');
  console.log('=========================================\n');

  await testEndpoint('Health Check', 'GET', '/health', 200);

  // Test 2: Authentication
  console.log('=========================================');
  console.log('Test Suite 2: Authentication');
  console.log('=========================================\n');

  // Register user
  const registerResult = await testEndpoint(
    'User Registration',
    'POST',
    '/auth/signup',
    201,
    {},
    {
      email: testUserEmail,
      password: 'Test123!',
      name: 'Test User'
    }
  );

  if (registerResult.success) {
    // Login
    const loginResult = await testEndpoint(
      'User Login',
      'POST',
      '/auth/login',
      200,
      {},
      {
        email: testUserEmail,
        password: 'Test123!'
      }
    );

    if (loginResult.success) {
      try {
        const loginData = JSON.parse(loginResult.data);
        authToken = loginData.data?.token || loginData.token;
        console.log('✅ Auth token received');
      } catch (e) {
        console.log('❌ Could not parse login response');
      }
    }
  }

  if (authToken) {
    const authHeader = { 'Authorization': `Bearer ${authToken}` };

    // Test 3: Field Operations
    console.log('=========================================');
    console.log('Test Suite 3: Field Operations');
    console.log('=========================================\n');

    // Create field
    const fieldData = {
      name: 'Test Field',
      boundary: {
        type: 'Polygon',
        coordinates: [[
          [79.8, 6.9],
          [79.9, 6.9],
          [79.9, 7.0],
          [79.8, 7.0],
          [79.8, 6.9]
        ]]
      },
      crop_type: 'rice'
    };

    const createFieldResult = await testEndpoint(
      'Field Creation',
      'POST',
      '/fields',
      201,
      authHeader,
      fieldData
    );

    let fieldId = null;
    if (createFieldResult.success) {
      try {
        const fieldResponse = JSON.parse(createFieldResult.data);
        fieldId = fieldResponse.data?.field?.id || fieldResponse.field?.id;
        console.log(`✅ Field created with ID: ${fieldId}`);
      } catch (e) {
        console.log('❌ Could not parse field creation response');
      }
    }

    // List fields
    await testEndpoint('Field Listing', 'GET', '/fields', 200, authHeader);

    // Test 4: ML Features
    console.log('=========================================');
    console.log('Test Suite 4: ML Features');
    console.log('=========================================\n');

    // Test segmentation
    await testEndpoint(
      'ML Segmentation',
      'POST',
      '/ml/segmentation/predict',
      200,
      authHeader,
      {
        bbox: [79.8, 6.9, 79.9, 7.0],
        date: '2024-12-01',
        return: 'mask_url'
      }
    );

    // Test yield prediction
    await testEndpoint(
      'ML Yield Prediction',
      'POST',
      '/ml/yield/predict',
      200,
      authHeader,
      {
        features: [{
          field_id: fieldId || 'test-field-id',
          feature1: 1.0,
          feature2: 2.0,
          feature3: 25.5,
          feature4: 0.75
        }]
      }
    );

    // Test 5: Health Monitoring
    console.log('=========================================');
    console.log('Test Suite 5: Health Monitoring');
    console.log('=========================================\n');

    if (fieldId) {
      await testEndpoint(
        'Field Health History',
        'GET',
        `/fields/${fieldId}/health/history?period=30d`,
        200,
        authHeader
      );

      await testEndpoint(
        'Field Recommendations',
        'GET',
        `/fields/${fieldId}/recommendations`,
        200,
        authHeader
      );
    }

    // Test 6: Weather
    console.log('=========================================');
    console.log('Test Suite 6: Weather');
    console.log('=========================================\n');

    await testEndpoint(
      'Weather Data',
      'GET',
      '/weather/current?lat=6.9271&lon=79.8612',
      200,
      authHeader
    );

  } else {
    console.log('❌ Cannot proceed with authenticated tests - no auth token');
  }

  // Test 7: CORS and Error Handling
  console.log('=========================================');
  console.log('Test Suite 7: CORS and Error Handling');
  console.log('=========================================\n');

  await testEndpoint('CORS Preflight', 'OPTIONS', '/auth/login', 200);
  await testEndpoint('404 Not Found', 'GET', '/nonexistent', 404);

  console.log('\n🎉 Testing completed!');
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
}