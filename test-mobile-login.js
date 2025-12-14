#!/usr/bin/env node

/**
 * Test Mobile App Login
 * Tests the login API endpoint that the mobile app uses
 */

const API_BASE_URL = 'https://backend-production-9e94.up.railway.app';
const API_BASE = `${API_BASE_URL}/api/v1`;

async function testLogin() {
  console.log('\n🔐 Testing Mobile App Login\n');
  console.log('Backend URL:', API_BASE_URL);
  console.log('');

  const credentials = {
    email: 'nadunsulochana92@gmail.com',
    password: '6pjNSVz28VZaXKu'
  };

  try {
    console.log('1. Testing Login Endpoint...');
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Login: SUCCESS');
      console.log('   Status:', response.status);
      console.log('   Token received:', data.data?.token ? 'Yes' : 'No');
      console.log('   User ID:', data.data?.user?.id || data.data?.user?.user_id);
      console.log('   User Name:', data.data?.user?.name);
      console.log('   User Email:', data.data?.user?.email);
      console.log('\n🎉 Login credentials are valid!');
      console.log('\n📱 You can now use these credentials in Expo Go:\n');
      console.log('   Email: nadunsulochana92@gmail.com');
      console.log('   Password: 6pjNSVz28VZaXKu\n');
      return true;
    } else {
      console.log('❌ Login: FAILED');
      console.log('   Status:', response.status);
      console.log('   Error:', JSON.stringify(data, null, 2));
      
      if (response.status === 401) {
        console.log('\n⚠️  Invalid credentials - please check email/password');
      } else if (response.status === 500) {
        console.log('\n⚠️  Server error - backend may have an issue');
      }
      return false;
    }
  } catch (error) {
    console.log('❌ Login Test Error:', error.message);
    return false;
  }
}

testLogin().then(success => {
  process.exit(success ? 0 : 1);
});
