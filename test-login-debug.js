#!/usr/bin/env node

/**
 * Debug Login Issue
 * Tests login with detailed error information
 */

const API_BASE_URL = 'https://backend-production-9e94.up.railway.app';
const API_BASE = `${API_BASE_URL}/api/v1`;

async function debugLogin() {
  console.log('\n🔍 Debugging Login Issue\n');
  
  const credentials = {
    email: 'nadunsulochana92@gmail.com',
    password: '6pjNSVz28VZaXKu'
  };

  try {
    console.log('1. Testing Backend Connectivity...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (healthResponse.ok) {
      console.log('✅ Backend is accessible');
    } else {
      console.log('❌ Backend health check failed');
      return;
    }

    console.log('\n2. Testing Login Endpoint...');
    console.log('URL:', `${API_BASE}/auth/login`);
    console.log('Method: POST');
    console.log('Body:', JSON.stringify(credentials, null, 2));
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    console.log('\n3. Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('\n4. Response Data:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Login API works correctly!');
      console.log('\n📱 If login fails in the app, check:');
      console.log('   1. Browser console for errors (F12)');
      console.log('   2. Network tab for failed requests');
      console.log('   3. CORS errors in console');
      console.log('   4. API_BASE_URL in mobile/src/config/env.ts');
    } else {
      console.log('\n❌ Login API returned error');
      console.log('Error details:', data);
    }
  } catch (error) {
    console.log('\n❌ Network Error:', error.message);
    console.log('Stack:', error.stack);
  }
}

debugLogin();
