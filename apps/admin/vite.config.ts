import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

const uiRoot = fileURLToPath(new URL('../../packages/ui/src', import.meta.url));

export default defineConfig({
  plugins: [vue()],
  server: { port: 3002 },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@ajkerbazardor/ui': uiRoot,
    },
  },
  optimizeDeps: {
    include: ['@ajkerbazardor/shared', 'vue-router', 'pinia', 'ofetch'],
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
});
