// jest.setup.ts — global test setup.
// Keep minimal in Phase 0; add RN/native module mocks (reanimated, rnmapbox) as features land.

// Deterministic env for any code that reads it during tests.
process.env.EXPO_PUBLIC_APP_ENV = 'test';
