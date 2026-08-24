import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tests live outside src/ so the application code stays clean.
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
