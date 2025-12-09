#!/usr/bin/env node

/**
 * Test ML Endpoints Script
 * Tests the ML segmentation and yield prediction endpoints
 */

const BASE_URL = 'https://backend-production-9e94.up.railway.app';
const API_BASE = `${BASE_URL}/api/v1`;

async function testMLEndpoints() {
  console.log('🧪 Testing ML Endpoints...\n');

  let authToken = null;

  try {
    // Step 1: Try to login with existing test user first
    console.log('1. Attempting login with existing test user...');
    let loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      authToken = loginData.data.token;
      console.log('✅ Login successful with existing user\n');
    } else {
      // If login fails, try to register a new user
      console.log('Existing user login failed, registering new user...');
      const testEmail = `test-${Date.now()}@example.com`;
      const registerResponse = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          password: 'Test123!',
          name: 'Test User'
        })
      });

      if (!registerResponse.ok) {
        throw new Error(`Registration failed: ${registerResponse.status} ${registerResponse.statusText}`);
      }

      console.log('✅ User registered successfully');

      // Now login with the new user
      loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          password: 'Test123!'
        })
      });

      if (!loginResponse.ok) {
        throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
      }

      const loginData = await loginResponse.json();
      authToken = loginData.data.token;
      console.log('✅ Login successful, got auth token\n');
    }

    // Step 3: Test segmentation predict endpoint
    console.log('3. Testing segmentation predict endpoint...');
    const segmentationPayload = {
      bbox: [79.8, 6.9, 79.9, 7.0],
      date: '2024-12-01',
      return: 'mask_url'
    };

    console.log('Payload:', JSON.stringify(segmentationPayload, null, 2));

    const segmentationResponse = await fetch(`${API_BASE}/ml/segmentation/predict`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(segmentationPayload)
    });

    if (!segmentationResponse.ok) {
      const errorText = await segmentationResponse.text();
      throw new Error(`Segmentation predict failed: ${segmentationResponse.status} ${segmentationResponse.statusText} - ${errorText}`);
    }

    const segmentationData = await segmentationResponse.json();
    console.log('✅ Segmentation predict response:');
    console.log(JSON.stringify(segmentationData, null, 2));
    console.log();

    // Step 4: Test yield predict endpoint
    console.log('4. Testing yield predict endpoint...');
    const yieldPayload = {
      features: [
        {
          field_id: '550e8400-e29b-41d4-a716-446655440000',
          feature1: 1.0,
          feature2: 2.0,
          feature3: 25.5,
          feature4: 0.75
        }
      ]
    };

    console.log('Payload:', JSON.stringify(yieldPayload, null, 2));

    const yieldResponse = await fetch(`${API_BASE}/ml/yield/predict`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(yieldPayload)
    });

    if (!yieldResponse.ok) {
      const errorText = await yieldResponse.text();
      throw new Error(`Yield predict failed: ${yieldResponse.status} ${yieldResponse.statusText} - ${errorText}`);
    }

    const yieldData = await yieldResponse.json();
    console.log('✅ Yield predict response:');
    console.log(JSON.stringify(yieldData, null, 2));
    console.log();

    console.log('🎉 All ML endpoints tested successfully!');
    console.log('✅ No MODEL_NOT_FOUND errors detected');

  } catch (error) {
    console.error('❌ Test failed:');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testMLEndpoints().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { testMLEndpoints };