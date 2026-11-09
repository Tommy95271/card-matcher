import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  root: './',
  base: '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  plugins: [
    {
      name: 'version-service-worker',
      closeBundle() {
        const swDistPath = path.resolve(__dirname, 'dist/service-worker.js');
        if (fs.existsSync(swDistPath)) {
          let content = fs.readFileSync(swDistPath, 'utf-8');
          const version = `v${pkg.version}-${Date.now()}`;
          content = content.replace(
            /const CACHE_NAME = ['"][^'"]+['"];/,
            `const CACHE_NAME = 'card-matcher-${version}'; // Auto-versioned SemVer v${pkg.version} ${new Date().toISOString()}`
          );
          fs.writeFileSync(swDistPath, content, 'utf-8');
          console.log(`\n🚀 [PWA] Injected dynamic cache version: card-matcher-${version} into dist/service-worker.js`);
        }
      }
    }
  ],
  server: {
    port: 3000,
    open: false
  }
});

