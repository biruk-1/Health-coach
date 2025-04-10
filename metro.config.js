const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add extraNodeModules for web platform
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native': require.resolve('react-native-web'),
};

// Add sourceExts to handle web extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'web.tsx',
  'web.ts',
  'web.jsx',
  'web.js',
];

module.exports = config;