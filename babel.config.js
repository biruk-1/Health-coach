module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      '@babel/plugin-transform-export-namespace-from',
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: ['REVENUECAT_API_KEY_IOS', 'REVENUECAT_API_KEY_ANDROID'],
        safe: false,
        allowUndefined: true,
      }],
      ['module-resolver', {
        root: ['./'],
        alias: {
          '@hooks': './app/hooks',
          '@components': './app/components',
          '@services': './app/services',
          '@context': './app/context',
          '@lib': './app/lib',
        },
      }],
    ],
  };
}; 