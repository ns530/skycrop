/**
 * Expo Debug Helper Script
 * 
 * This script helps debug common Expo Go issues
 */

const https = require('https');
const http = require('http');

console.log('🔍 SkyCrop Mobile - Debug Helper\n');
console.log('='.repeat(50));

// Check 1: Backend API connectivity
console.log('\n1️⃣ Checking Backend API...');
const backendUrl = 'https://backend-production-9e94.up.railway.app';

const checkBackend = () => {
  return new Promise((resolve) => {
    const url = new URL(backendUrl);
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.get(url, { timeout: 5000 }, (res) => {
      console.log(`   ✅ Backend is reachable (Status: ${res.statusCode})`);
      resolve(true);
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Backend connection failed: ${error.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log(`   ⚠️  Backend connection timeout`);
      req.destroy();
      resolve(false);
    });
  });
};

// Check 2: Expo Dev Server
console.log('\n2️⃣ Checking Expo Dev Server...');
const checkExpoServer = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:8081/status', { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const status = JSON.parse(data);
          console.log(`   ✅ Expo server is running`);
          console.log(`   📦 Bundle: ${status.bundleUrl || 'N/A'}`);
          resolve(true);
        } catch (e) {
          console.log(`   ✅ Expo server is running (status endpoint responded)`);
          resolve(true);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Expo server not accessible: ${error.message}`);
      console.log(`   💡 Try running: cd mobile && npx expo start`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log(`   ⚠️  Expo server timeout`);
      req.destroy();
      resolve(false);
    });
  });
};

// Check 3: Test Login API
console.log('\n3️⃣ Testing Login API...');
const testLogin = () => {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({
      email: 'nadunsulochana92@gmail.com',
      password: '6pjNSVz28VZaXKu'
    });

    const url = new URL(`${backendUrl}/api/v1/auth/login`);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      },
      timeout: 10000
    };

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log(`   ✅ Login API works (Status: ${res.statusCode})`);
            console.log(`   👤 User: ${response.user?.name || 'N/A'}`);
            resolve(true);
          } catch (e) {
            console.log(`   ✅ Login API works (Status: ${res.statusCode})`);
            resolve(true);
          }
        } else {
          console.log(`   ⚠️  Login API returned status: ${res.statusCode}`);
          console.log(`   📄 Response: ${data.substring(0, 100)}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Login API error: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`   ⚠️  Login API timeout`);
      req.destroy();
      resolve(false);
    });

    req.write(loginData);
    req.end();
  });
};

// Run all checks
(async () => {
  const backendOk = await checkBackend();
  const expoOk = await checkExpoServer();
  const loginOk = await testLogin();

  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Summary:');
  console.log(`   Backend API: ${backendOk ? '✅' : '❌'}`);
  console.log(`   Expo Server: ${expoOk ? '✅' : '❌'}`);
  console.log(`   Login API: ${loginOk ? '✅' : '❌'}`);

  if (backendOk && expoOk && loginOk) {
    console.log('\n✅ All checks passed! Your app should work.');
    console.log('\n💡 To view logs in Expo Go:');
    console.log('   1. Shake your device (or press Cmd+D on iOS simulator)');
    console.log('   2. Select "Debug Remote JS"');
    console.log('   3. Open Chrome DevTools at chrome://inspect');
    console.log('   4. Or check the terminal where Expo is running');
  } else {
    console.log('\n⚠️  Some checks failed. Please fix the issues above.');
  }

  console.log('\n📱 Expo Go Debugging Tips:');
  console.log('   • Shake device → "Show Dev Menu"');
  console.log('   • Enable "Debug Remote JS" to see console logs');
  console.log('   • Check terminal for Metro bundler errors');
  console.log('   • Use "Reload" to refresh the app');
  console.log('   • Check network tab in Chrome DevTools if using remote debugging');
  console.log('\n');
})();
