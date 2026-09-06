import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/mocks/**',
        'src/data/**',
        'src/components/ui/**',
      ],
      thresholds: {
        // Ngưỡng tăng dần theo từng phase refactor. Đích cuối (Phase 4):
        // lib 90/85/90/90, store 85/75/85/85, global 75/70/75/75.
        'src/lib/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/store/**': { statements: 60, branches: 70, functions: 45, lines: 60 },
        global: { statements: 35, branches: 55, functions: 40, lines: 35 },
      },
    },
  },
});
