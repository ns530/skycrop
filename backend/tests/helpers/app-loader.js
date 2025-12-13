/**
 * Helper to load the Express app for integration tests
 * Handles ES module import and converts to CommonJS
 */

let appInstance = null;

async function loadApp() {
  if (appInstance) {
    return appInstance;
  }

  try {
    // Try dynamic import (ES modules)
    const appModule = await import('../../src/app');
    appInstance = appModule.default;
  } catch (e) {
    // Fallback: create a basic Express app
    const express = require('express');
    appInstance = express();
    appInstance.use(express.json());
    console.warn('Failed to load app.js, using basic Express app:', e.message);
  }

  return appInstance;
}

// For synchronous access (will be null until loadApp is called)
function getApp() {
  return appInstance;
}

module.exports = { loadApp, getApp };

