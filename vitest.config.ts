import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['src/**/*.spec.tsx', 'jsdom'],
      ['src/**/*.test.tsx', 'jsdom'],
    ],
    globals: true,
    include: [
      'src/**/*.spec.ts',
      'src/**/*.spec.tsx',
      'src/**/*.spec.js',
      'src/**/*.spec.jsx',
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'scripts/lib/**/*.spec.ts',
      'scripts/commands/**/*.spec.ts',
    ],
    coverage: {
      include: [
        'src/app/parliament/**',
        'scripts/lib/**',
        'scripts/commands/**',
      ],
      thresholds: {
        autoUpdate: true,
        lines: 69.65,
        functions: 89.84,
        branches: 93.1,
        'scripts/lib/**': { lines: 100, functions: 100, branches: 97.34 },
        'scripts/commands/**': {
          lines: 91.35,
          functions: 100,
          branches: 95.23,
        },
      },
    },
  },
});
