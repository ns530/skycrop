#!/usr/bin/env node

/**
 * Direct ML Service Test
 * Tests the ML service directly to verify model file is working
 */

const ML_SERVICE_URL = 'https://skycrop-ml-service-production.up.railway.app';
const ML_TOKEN = 'skycrop-ml-internal-token-2024';

async function testMLService() {
  console.log('\n🧪 Testing ML Service Directly\n');
  console.log('ML Service URL:', ML_SERVICE_URL);
  console.log('');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Endpoint...');
    const healthResponse = await fetch(`${ML_SERVICE_URL}/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log('✅ Health Check: PASS');
      console.log('   Uptime:', Math.round(healthData.uptime_s), 'seconds');
      console.log('   Version:', healthData.version);
    } else {
      console.log('❌ Health Check: FAIL');
      return;
    }

    // Test 2: ML Segmentation (this will test if model file exists)
    console.log('\n2. Testing ML Segmentation Endpoint...');
    const payload = {
      bbox: [80.10, 7.20, 80.12, 7.22], // Sri Lanka coordinates
      date: new Date().toISOString().split('T')[0],
      return: 'mask_url'
    };

    const mlResponse = await fetch(`${ML_SERVICE_URL}/v1/segmentation/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': ML_TOKEN
      },
      body: JSON.stringify(payload)
    });

    const mlData = await mlResponse.json();

    if (mlResponse.ok) {
      console.log('✅ ML Segmentation: PASS');
      console.log('   Request ID:', mlData.request_id);
      console.log('   Model:', mlData.model?.name, mlData.model?.version);
      console.log('   Mask URL:', mlData.mask_url ? 'Generated' : 'N/A');
      console.log('   Metrics:', JSON.stringify(mlData.metrics, null, 2));
      console.log('\n🎉 SUCCESS! Model file is working correctly!\n');
      return true;
    } else {
      console.log('❌ ML Segmentation: FAIL');
      console.log('   Status:', mlResponse.status);
      console.log('   Error:', JSON.stringify(mlData, null, 2));
      
      if (mlData.error?.details?.details?.includes('NO_SUCHFILE') || 
          mlData.error?.details?.details?.includes('File doesn\'t exist')) {
        console.log('\n⚠️  Model file still not found in deployment');
        console.log('   The model file may not have been included in the build');
      }
      return false;
    }
  } catch (error) {
    console.log('❌ Test Error:', error.message);
    return false;
  }
}

testMLService().then(success => {
  process.exit(success ? 0 : 1);
});
