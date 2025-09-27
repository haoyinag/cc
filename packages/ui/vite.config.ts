import { defineConfig } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@cmdcc/shared': path.resolve(__dirname, '../shared/src')
    }
  },
  server: {
    port: 4576,
    proxy: {
      '/api': {
        target: 'http://localhost:3777',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
}));
