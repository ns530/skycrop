#!/usr/bin/env node

/**
 * Test Frontend Application Loading
 */

const FRONTEND_URL = 'https://skycrop.vercel.app/';

async function testFrontend() {
  console.log('🧪 Testing Frontend Application Loading...\n');

  try {
    console.log(`Testing: ${FRONTEND_URL}`);

    const response = await fetch(FRONTEND_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);

    if (response.ok) {
      const text = await response.text();
      const isHTML = text.includes('<html') || text.includes('<!DOCTYPE html');
      const hasTitle = text.includes('<title>') || text.includes('SkyCrop');

      console.log(`✅ Frontend loads successfully`);
      console.log(`✅ Contains HTML: ${isHTML}`);
      console.log(`✅ Has title/content: ${hasTitle}`);
      console.log(`Content length: ${text.length} characters`);

      // Check for common frontend indicators
      const hasReact = text.includes('react') || text.includes('React');
      const hasScripts = text.includes('<script');
      const hasStyles = text.includes('<style') || text.includes('<link');

      console.log(`React detected: ${hasReact}`);
      console.log(`Has scripts: ${hasScripts}`);
      console.log(`Has styles: ${hasStyles}`);

      return true;
    } else {
      console.log(`❌ Frontend failed to load: ${response.status} ${response.statusText}`);
      return false;
    }

  } catch (error) {
    console.log(`❌ Error testing frontend: ${error.message}`);
    return false;
  }
}

// Test API connectivity from frontend perspective
async function testAPIConnectivity() {
  console.log('\n🔗 Testing API Connectivity from Frontend...\n');

  const API_BASE = 'https://backend-production-9e94.up.railway.app/api/v1';

  // Test CORS preflight
  try {
    console.log('Testing CORS preflight...');
    const corsResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });

    console.log(`CORS preflight status: ${corsResponse.status}`);
    console.log(`CORS headers present: ${corsResponse.headers.has('access-control-allow-origin')}`);

  } catch (error) {
    console.log(`❌ CORS test failed: ${error.message}`);
  }
}

// Run tests
async function runAllTests() {
  const frontendOk = await testFrontend();
  await testAPIConnectivity();

  console.log('\n🎉 Frontend testing completed!');
  console.log(`Overall status: ${frontendOk ? '✅ PASS' : '❌ FAIL'}`);
}

if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
}