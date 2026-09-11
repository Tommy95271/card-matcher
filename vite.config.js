import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: '/card-matcher/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  server: {
    port: 3000,
    open: false
  }
});
