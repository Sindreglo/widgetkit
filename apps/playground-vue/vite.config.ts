import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

// Resolve workspace packages directly from source — no build step needed during dev.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: '@breeze/scheduler-vue/styles.css',
        replacement: resolve(__dirname, '../../packages/scheduler-vue/src/styles.css'),
      },
      {
        find: '@breeze/scheduler-vue',
        replacement: resolve(__dirname, '../../packages/scheduler-vue/src/index.ts'),
      },
      {
        find: '@breeze/scheduler',
        replacement: resolve(__dirname, '../../packages/scheduler/src/index.ts'),
      },
      {
        find: '@breeze/core',
        replacement: resolve(__dirname, '../../packages/core/src/index.ts'),
      },
    ],
  },
});
