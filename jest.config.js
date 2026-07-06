// jest.config.js — jest-expo preset covers both RN component tests and pure-logic (scoring) tests.
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  clearMocks: true,
  // Only *.test/*.spec files are suites — lets us keep fixtures/helpers under __tests__ without
  // jest treating them as (empty) test files.
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'scripts/**/*.ts',
    '!src/types/database.ts',
    '!**/*.d.ts',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/.*|nativewind|react-native-css-interop|@rnmapbox/.*|@tanstack/.*))',
  ],
};
