#!/usr/bin/env node

/**
 * Test WebSocket Connections
 */

const WS_URL = 'wss://backend-production-9e94.up.railway.app';

async function testWebSocket() {
  console.log('🧪 Testing WebSocket Connections...\n');

  return new Promise((resolve) => {
    try {
      const WebSocket = require('ws');
      const ws = new WebSocket(WS_URL);

      let connected = false;
      let receivedMessage = false;

      ws.on('open', () => {
        console.log('✅ WebSocket connection established');
        connected = true;

        // Send a test message
        ws.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        }));
      });

      ws.on('message', (data) => {
        console.log('✅ WebSocket message received:', data.toString());
        receivedMessage = true;
      });

      ws.on('error', (error) => {
        console.log('❌ WebSocket error:', error.message);
      });

      ws.on('close', (code, reason) => {
        console.log(`WebSocket closed: ${code} - ${reason.toString()}`);
        console.log(`Connection successful: ${connected}`);
        console.log(`Message received: ${receivedMessage}`);
        resolve({ connected, receivedMessage });
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        resolve({ connected, receivedMessage, timeout: true });
      }, 10000);

    } catch (error) {
      console.log('❌ WebSocket test failed:', error.message);
      resolve({ connected: false, error: error.message });
    }
  });
}

// Run test
if (require.main === module) {
  testWebSocket().then(result => {
    console.log('\n🎉 WebSocket testing completed!');
    console.log('Result:', result);
  });
}