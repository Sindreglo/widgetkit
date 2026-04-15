import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Resolve workspace packages directly from source — no build step needed during dev.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@widgetkit/scheduler-react/styles.css',
        replacement: resolve(__dirname, '../../packages/scheduler-react/src/styles.css'),
      },
      {
        find: '@widgetkit/scheduler-react',
        replacement: resolve(__dirname, '../../packages/scheduler-react/src/index.ts'),
      },
      {
        find: '@widgetkit/booking-react/styles.css',
        replacement: resolve(__dirname, '../../packages/booking-react/src/styles.css'),
      },
      {
        find: '@widgetkit/booking-react',
        replacement: resolve(__dirname, '../../packages/booking-react/src/index.ts'),
      },
      {
        find: '@widgetkit/scheduler',
        replacement: resolve(__dirname, '../../packages/scheduler/src/index.ts'),
      },
      {
        find: '@widgetkit/booking',
        replacement: resolve(__dirname, '../../packages/booking/src/index.ts'),
      },
      {
        find: '@widgetkit/core',
        replacement: resolve(__dirname, '../../packages/core/src/index.ts'),
      },
      {
        find: '@widgetkit/spreadsheet-react/styles.css',
        replacement: resolve(__dirname, '../../packages/spreadsheet-react/src/styles.css'),
      },
      {
        find: '@widgetkit/spreadsheet-react',
        replacement: resolve(__dirname, '../../packages/spreadsheet-react/src/index.ts'),
      },
      {
        find: '@widgetkit/spreadsheet',
        replacement: resolve(__dirname, '../../packages/spreadsheet/src/index.ts'),
      },
    ],
  },
});
