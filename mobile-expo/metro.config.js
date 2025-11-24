// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Improve compatibility with Expo Go
config.resolver = {
  ...config.resolver,
  // Ensure proper module resolution
  sourceExts: [...(config.resolver?.sourceExts || []), 'js', 'jsx', 'ts', 'tsx', 'json'],
};

// Improve transformer for better Expo Go compatibility
config.transformer = {
  ...config.transformer,
  // Enable inline requires for better performance
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: false, // Disable inline requires for Expo Go compatibility
    },
  }),
};

module.exports = config;

