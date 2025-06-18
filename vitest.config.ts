import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testMatch: ["**/__tests__/**/*.[jt]s?(x)","**/?(*.)+(spec|test).[jt]s?(x)"],
    setupFiles: ['./test/vitest.setup.ts'],
  },
});
