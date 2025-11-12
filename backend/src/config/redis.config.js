'use strict';

const { createClient } = require('redis');

const {
  REDIS_URL = 'redis://localhost:6379',
  NODE_ENV = 'development',
} = process.env;

let client;

/**
 * Initialize and return a singleton Redis client.
 * Uses v4 redis client with promise-based API.
 */
function getRedisClient() {
  if (!client) {
    client = createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          // Exponential backoff up to ~10s
          const delay = Math.min(retries * 200, 10_000);
          return delay;
        },
      },
    });

    client.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('Redis Client Error:', err.message);
    });

    client.on('connect', () => {
      if (NODE_ENV !== 'test') {
        // eslint-disable-next-line no-console
        console.log('Redis connected');
      }
    });

    client.on('reconnecting', () => {
      if (NODE_ENV !== 'test') {
        // eslint-disable-next-line no-console
        console.log('Redis reconnecting...');
      }
    });
  }
  return client;
}

/**
 * Ensure connection is established. Can be awaited at app start.
 */
async function initRedis() {
  const c = getRedisClient();
  if (!c.isOpen) {
    await c.connect();
  }
  return c;
}

module.exports = {
  getRedisClient,
  initRedis,
};