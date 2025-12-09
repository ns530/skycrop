#!/usr/bin/env node

/**
 * Deployment Diagnostic Script
 * Tests backend endpoints and configuration
 */

const https = require('https');

const BACKEND_URL = 'https://backend-production-9e94.up.railway.app';
const FRONTEND_URL = 'https://skycrop.vercel.app';

console.log('🔍 SkyCrop Deployment Diagnostics\n');
console.log('='.repeat(60));

// Helper to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function runTests() {
  console.log('\n📡 Testing Backend Endpoints\n');

  // Test 1: Health Check
  try {
    console.log('1. Testing /health endpoint...');
    const health = await makeRequest(`${BACKEND_URL}/health`);
    console.log(`   ✅ Status: ${health.status}`);
    console.log(`   Response: ${health.data.substring(0, 100)}...`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 2: Root endpoint
  try {
    console.log('\n2. Testing root endpoint...');
    const root = await makeRequest(`${BACKEND_URL}/`);
    console.log(`   ✅ Status: ${root.status}`);
    console.log(`   Response: ${root.data.substring(0, 100)}...`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 3: Auth Login endpoint (should return 400/401, not 404)
  try {
    console.log('\n3. Testing /api/v1/auth/login endpoint...');
    const login = await makeRequest(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      body: { email: 'test@test.com', password: 'test' },
    });
    console.log(`   Status: ${login.status}`);
    if (login.status === 404) {
      console.log(`   ❌ 404 NOT FOUND - Route doesn't exist!`);
    } else if (login.status === 400 || login.status === 401) {
      console.log(`   ✅ Endpoint exists (${login.status} = validation/auth error, not 404)`);
    } else {
      console.log(`   ⚠️  Unexpected status: ${login.status}`);
    }
    console.log(`   Response: ${login.data.substring(0, 200)}...`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 4: Auth Signup endpoint
  try {
    console.log('\n4. Testing /api/v1/auth/signup endpoint...');
    const signup = await makeRequest(`${BACKEND_URL}/api/v1/auth/signup`, {
      method: 'POST',
      body: { email: 'test@test.com', password: 'test123', name: 'Test User' },
    });
    console.log(`   Status: ${signup.status}`);
    if (signup.status === 404) {
      console.log(`   ❌ 404 NOT FOUND - Route doesn't exist!`);
    } else if (signup.status === 400 || signup.status === 409) {
      console.log(`   ✅ Endpoint exists (${signup.status} = validation error, not 404)`);
    } else {
      console.log(`   ⚠️  Unexpected status: ${signup.status}`);
    }
    console.log(`   Response: ${signup.data.substring(0, 200)}...`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 5: CORS headers
  try {
    console.log('\n5. Testing CORS headers...');
    const corsTest = await makeRequest(`${BACKEND_URL}/health`, {
      headers: {
        'Origin': FRONTEND_URL,
      },
    });
    console.log(`   Access-Control-Allow-Origin: ${corsTest.headers['access-control-allow-origin'] || 'NOT SET'}`);
    if (corsTest.headers['access-control-allow-origin']) {
      if (corsTest.headers['access-control-allow-origin'].includes('skycrop.vercel.app')) {
        console.log(`   ✅ CORS configured correctly for Vercel domain`);
      } else {
        console.log(`   ⚠️  CORS origin: ${corsTest.headers['access-control-allow-origin']}`);
        console.log(`   ⚠️  May not include skycrop.vercel.app`);
      }
    } else {
      console.log(`   ❌ CORS headers not present`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 6: Check if frontend can reach backend
  console.log('\n6. Frontend Configuration Check...');
  console.log(`   Frontend URL: ${FRONTEND_URL}`);
  console.log(`   Backend URL: ${BACKEND_URL}`);
  console.log(`   Expected API calls to: ${BACKEND_URL}/api/v1/...`);
  console.log(`   ⚠️  If frontend calls ${FRONTEND_URL}/api/v1/..., VITE_API_BASE_URL is not set!`);

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Summary:');
  console.log('   - Check if backend endpoints return 404 (route not found)');
  console.log('   - Check if CORS headers include your Vercel domain');
  console.log('   - Verify VITE_API_BASE_URL is set in Vercel');
  console.log('   - Check browser Network tab for actual request URLs\n');
}

runTests().catch(console.error);
