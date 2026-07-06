// babel.config.js — NativeWind v4 via jsxImportSource + nativewind/babel preset.
// Reanimated v4 / worklets plugin is auto-configured by babel-preset-expo on SDK 57 (do NOT add it here).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
