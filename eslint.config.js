// eslint.config.js — flat config built on eslint-config-expo.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Generated + build artifacts. (strict tsc already guards against implicit any across app code.)
    ignores: ['dist/*', 'node_modules/*', 'src/types/database.ts', '.expo/*'],
  },
]);
