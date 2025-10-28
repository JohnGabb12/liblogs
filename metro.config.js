const { getDefaultConfig } = require('expo/metro-config');

// Get default Expo Metro config
const config = getDefaultConfig(__dirname);

// Add support for .wasm files (needed for expo-sqlite on web)
config.resolver.assetExts.push('wasm');

// Remove 'wasm' from sourceExts if it was added there
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'wasm');

module.exports = config;
