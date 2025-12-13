const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration
 * https://docs.expo.dev/guides/customizing-metro/
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// Configure resolver to handle platform-specific modules
config.resolver = {
  ...config.resolver,
  // Add source extensions for platform-specific files
  sourceExts: [...(config.resolver?.sourceExts || []), 'web.js', 'web.ts', 'web.tsx'],
};

module.exports = config;

