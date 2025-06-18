import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testMatch: ["**/__tests__/**/*.[jt]s?(x)","**/?(*.)+(spec|test).[jt]s?(x)"],
    coverage: {
      provider: 'v8',
      reporter: ['json', 'lcov', 'clover', 'cobertura', 'text'],
      exclude: ['**/node_modules/**'],
    },
    setupFiles: ['./test/vitest.setup.ts'],
  },
});
