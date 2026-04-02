import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'node',
    globals: true,
    include: [
      'src/**/*.spec.ts',
      'src/**/*.spec.tsx',
      'src/**/*.spec.js',
      'src/**/*.spec.jsx',
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
    ],
    coverage: {
      include: ['src/app/parliament/**'],
      thresholds: {
        lines: 55,
        functions: 80,
        branches: 85,
      },
    },
  },
});
