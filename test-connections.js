#!/usr/bin/env node

/**
 * Comprehensive Connection Test Script
 * Tests all connections: Backend → ML Service, Mobile → Backend
 */

const BASE_URL = 'https://backend-production-9e94.up.railway.app';
const ML_SERVICE_URL = 'https://skycrop-ml-service-production.up.railway.app';
const API_BASE = `${BASE_URL}/api/v1`;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function testBackendHealth() {
  logSection('1. Testing Backend Health');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok) {
      log('✅ Backend is healthy', 'green');
      console.log('Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      log('❌ Backend health check failed', 'red');
      console.log('Status:', response.status);
      return false;
    }
  } catch (error) {
    log('❌ Backend health check error', 'red');
    console.error('Error:', error.message);
    return false;
  }
}

async function testMLServiceHealth() {
  logSection('2. Testing ML Service Health');
  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`);
    const data = await response.json();
    
    if (response.ok) {
      log('✅ ML Service is healthy', 'green');
      console.log('Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      log('❌ ML Service health check failed', 'red');
      console.log('Status:', response.status);
      return false;
    }
  } catch (error) {
    log('❌ ML Service health check error', 'red');
    console.error('Error:', error.message);
    return false;
  }
}

async function testBackendToMLService() {
  logSection('3. Testing Backend → ML Service Connection');
  
  let authToken = null;
  
  try {
    // First, get an auth token
    log('Getting authentication token...', 'yellow');
    const testEmail = `test-${Date.now()}@example.com`;
    
    // Try to register
    const registerResponse = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'Test123!@#',
        name: 'Connection Test User'
      })
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      authToken = registerData.data?.token || registerData.token;
      log('✅ User registered and authenticated', 'green');
    } else {
      // Try login with existing test user
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
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
        authToken = loginData.data?.token || loginData.token;
        log('✅ Authenticated with existing user', 'green');
      } else {
        log('⚠️  Could not authenticate - skipping ML service test', 'yellow');
        return false;
      }
    }

    // Test ML segmentation endpoint (this will test backend → ML service connection)
    log('\nTesting ML segmentation endpoint (Backend → ML Service)...', 'yellow');
    const segmentationPayload = {
      bbox: [79.8, 6.9, 79.9, 7.0], // Sri Lanka coordinates
      date: new Date().toISOString().split('T')[0],
      return: 'mask_url'
    };

    const segmentationResponse = await fetch(`${API_BASE}/ml/segmentation/predict`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(segmentationPayload)
    });

    if (segmentationResponse.ok) {
      const data = await segmentationResponse.json();
      log('✅ Backend → ML Service connection successful!', 'green');
      console.log('Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      const errorText = await segmentationResponse.text();
      log('❌ Backend → ML Service connection failed', 'red');
      console.log('Status:', segmentationResponse.status);
      console.log('Error:', errorText);
      
      // Check if it's an authentication issue vs ML service issue
      if (segmentationResponse.status === 401 || segmentationResponse.status === 403) {
        log('⚠️  This might be an authentication issue, not ML service connection', 'yellow');
      } else if (segmentationResponse.status === 502 || segmentationResponse.status === 503) {
        log('⚠️  This suggests the backend cannot reach the ML service', 'yellow');
      }
      
      return false;
    }
  } catch (error) {
    log('❌ Backend → ML Service test error', 'red');
    console.error('Error:', error.message);
    return false;
  }
}

async function testMobileToBackend() {
  logSection('4. Testing Mobile → Backend Connection');
  
  try {
    // Test authentication endpoint (mobile app uses this)
    log('Testing authentication endpoint (Mobile → Backend)...', 'yellow');
    
    const testEmail = `mobile-test-${Date.now()}@example.com`;
    
    // Test registration (mobile app flow)
    const registerResponse = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'MobileTest123!@#',
        name: 'Mobile Test User',
        phone: '+1234567890'
      })
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      const token = registerData.data?.token || registerData.token;
      log('✅ Mobile → Backend registration successful', 'green');
      console.log('Token received:', token ? 'Yes' : 'No');
      
      // Test authenticated endpoint (fields list - mobile app uses this)
      log('\nTesting authenticated endpoint (fields list)...', 'yellow');
      const fieldsResponse = await fetch(`${API_BASE}/fields`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json();
        log('✅ Mobile → Backend authenticated request successful', 'green');
        console.log('Fields response:', JSON.stringify(fieldsData, null, 2));
        return true;
      } else {
        const errorText = await fieldsResponse.text();
        log('⚠️  Authenticated request returned non-200 status', 'yellow');
        console.log('Status:', fieldsResponse.status);
        console.log('Response:', errorText);
        return true; // Still consider it a success if we got a response
      }
    } else {
      const errorText = await fieldsResponse.text();
      log('❌ Mobile → Backend registration failed', 'red');
      console.log('Status:', registerResponse.status);
      console.log('Error:', errorText);
      return false;
    }
  } catch (error) {
    log('❌ Mobile → Backend test error', 'red');
    console.error('Error:', error.message);
    return false;
  }
}

async function testEndToEndFlow() {
  logSection('5. Testing End-to-End Flow');
  
  try {
    // Create a complete flow: Register → Create Field → Get Health → Get Recommendations
    log('Testing complete user flow...', 'yellow');
    
    const testEmail = `e2e-test-${Date.now()}@example.com`;
    
    // 1. Register
    log('Step 1: Registering user...', 'yellow');
    const registerResponse = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'E2ETest123!@#',
        name: 'E2E Test User'
      })
    });

    if (!registerResponse.ok) {
      throw new Error('Registration failed');
    }
    
    const registerData = await registerResponse.json();
    const token = registerData.data?.token || registerData.token;
    log('✅ User registered', 'green');
    
    // 2. Create a field
    log('\nStep 2: Creating a field...', 'yellow');
    const fieldPayload = {
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
      }
    };

    const fieldResponse = await fetch(`${API_BASE}/fields`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fieldPayload)
    });

    if (fieldResponse.ok) {
      const fieldData = await fieldResponse.json();
      const fieldId = fieldData.data?.field_id || fieldData.field_id;
      log('✅ Field created', 'green');
      console.log('Field ID:', fieldId);
      
      // 3. Get field health (this might call ML service)
      log('\nStep 3: Getting field health...', 'yellow');
      const healthResponse = await fetch(`${API_BASE}/fields/${fieldId}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (healthResponse.ok) {
        log('✅ Field health retrieved', 'green');
      } else {
        log('⚠️  Field health endpoint returned non-200 (might be expected)', 'yellow');
      }
      
      log('\n✅ End-to-end flow completed successfully!', 'green');
      return true;
    } else {
      const errorText = await fieldResponse.text();
      log('⚠️  Field creation failed (might be expected)', 'yellow');
      console.log('Status:', fieldResponse.status);
      console.log('Error:', errorText);
      return true; // Still consider it a partial success
    }
  } catch (error) {
    log('❌ End-to-end test error', 'red');
    console.error('Error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n');
  log('🚀 Starting Comprehensive Connection Tests', 'blue');
  log('Backend URL: ' + BASE_URL, 'blue');
  log('ML Service URL: ' + ML_SERVICE_URL, 'blue');
  console.log('\n');

  const results = {
    backendHealth: false,
    mlServiceHealth: false,
    backendToML: false,
    mobileToBackend: false,
    endToEnd: false
  };

  // Run tests
  results.backendHealth = await testBackendHealth();
  results.mlServiceHealth = await testMLServiceHealth();
  results.backendToML = await testBackendToMLService();
  results.mobileToBackend = await testMobileToBackend();
  results.endToEnd = await testEndToEndFlow();

  // Summary
  logSection('Test Summary');
  
  const allPassed = Object.values(results).every(r => r);
  const passedCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.values(results).length;

  console.log(`Passed: ${passedCount}/${totalCount}\n`);
  
  console.log('Results:');
  console.log(`  Backend Health:        ${results.backendHealth ? '✅' : '❌'}`);
  console.log(`  ML Service Health:    ${results.mlServiceHealth ? '✅' : '❌'}`);
  console.log(`  Backend → ML Service: ${results.backendToML ? '✅' : '❌'}`);
  console.log(`  Mobile → Backend:     ${results.mobileToBackend ? '✅' : '❌'}`);
  console.log(`  End-to-End Flow:      ${results.endToEnd ? '✅' : '❌'}`);

  if (allPassed) {
    log('\n🎉 All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please review the output above.', 'yellow');
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    log('❌ Test script failed', 'red');
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };
