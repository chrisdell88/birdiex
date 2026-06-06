import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    // Speed: only run the test files we care about. We're not building a
    // full test suite — these are surgical guards on cross-page invariants.
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
