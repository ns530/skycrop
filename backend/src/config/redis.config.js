'use strict';

const { createClient } = require('redis');

const {
  REDIS_URL,
  REDIS_ENABLED = 'true',
  NODE_ENV = 'development',
} = process.env;

let client;
let redisAvailable = false;

/**
 * Check if Redis should be enabled
 */
function isRedisEnabled() {
  return REDIS_ENABLED !== 'false' && REDIS_URL && REDIS_URL !== '';
}

/**
 * Initialize and return a singleton Redis client.
 * Uses v4 redis client with promise-based API.
 * Returns null if Redis is disabled or unavailable.
 */
function getRedisClient() {
  if (!isRedisEnabled()) {
    if (NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.log('Redis is disabled or REDIS_URL not set - running without cache');
    }
    return null;
  }

  if (!client) {
    client = createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          // Stop trying after 5 attempts to avoid log spam
          if (retries > 5) {
            // eslint-disable-next-line no-console
            console.error('Redis connection failed after 5 retries - disabling Redis');
            redisAvailable = false;
            return false; // Stop reconnecting
          }
          // Exponential backoff up to ~10s
          const delay = Math.min(retries * 200, 10_000);
          return delay;
        },
      },
    });

    client.on('error', (err) => {
      redisAvailable = false;
      // eslint-disable-next-line no-console
      console.error('Redis Client Error:', err.message);
    });

    client.on('connect', () => {
      redisAvailable = true;
      if (NODE_ENV !== 'test') {
        // eslint-disable-next-line no-console
        console.log('Redis connected successfully');
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
 * Returns null if Redis is not available.
 */
async function initRedis() {
  if (!isRedisEnabled()) {
    return null;
  }

  try {
    const c = getRedisClient();
    if (c && !c.isOpen) {
      await c.connect();
      redisAvailable = true;
    }
    return c;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize Redis:', error.message);
    // eslint-disable-next-line no-console
    console.log('Continuing without Redis cache...');
    redisAvailable = false;
    return null;
  }
}

/**
 * Check if Redis is currently available
 */
function isRedisAvailable() {
  return redisAvailable && client && client.isOpen;
}

module.exports = {
  getRedisClient,
  initRedis,
  isRedisAvailable,
  isRedisEnabled,
};