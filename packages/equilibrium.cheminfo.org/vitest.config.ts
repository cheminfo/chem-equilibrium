import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // `e2e` holds Playwright specs; they are run by `npm run test-e2e`.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/__tests__/**', 'src/main.tsx', 'src/vite-env.d.ts'],
      provider: 'v8',
    },
    snapshotFormat: {
      maxOutputLength: Number.MAX_SAFE_INTEGER,
    },
  },
});
