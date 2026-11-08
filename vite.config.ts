import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath, URL } from 'node:url';
import pkg from './package.json' with { type: 'json' };

// Every asset is inlined so build/index.html opens over file:// with no server.
const INLINE_EVERYTHING_BYTES = 100 * 1024 * 1024;

export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  css: {
    preprocessorOptions: {
      scss: {},
    },
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
    assetsInlineLimit: INLINE_EVERYTHING_BYTES,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 5000,
  },
  preview: { port: 4173, strictPort: true },
});
