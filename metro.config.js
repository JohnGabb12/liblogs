const { getDefaultConfig } = require('expo/metro-config');

// Revert to default Expo Metro config (no NativeWind/Tailwind)
const config = getDefaultConfig(__dirname);

module.exports = config;
