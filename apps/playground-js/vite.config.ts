import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@widgetkit/scheduler-js/styles.css',
        replacement: resolve(__dirname, '../../packages/scheduler-js/src/styles.css'),
      },
      {
        find: '@widgetkit/scheduler-js',
        replacement: resolve(__dirname, '../../packages/scheduler-js/src/index.ts'),
      },
      {
        find: '@widgetkit/scheduler',
        replacement: resolve(__dirname, '../../packages/scheduler/src/index.ts'),
      },
      {
        find: '@widgetkit/core',
        replacement: resolve(__dirname, '../../packages/core/src/index.ts'),
      },
    ],
  },
});
