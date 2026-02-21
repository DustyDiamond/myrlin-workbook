import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    svelte(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '$lib': path.resolve('./src/lib'),
      '$components': path.resolve('./src/components'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://127.0.0.1:3456',
        changeOrigin: true,
        secure: false, // accept self-signed certs
      },
      '/ws': {
        target: 'wss://127.0.0.1:3456',
        ws: true,
        secure: false,
      },
    },
  },
  build: {
    // During development, build to dist/ so we don't overwrite the running vanilla app.
    // For production deployment: change to path.resolve('../src/web/public')
    outDir: path.resolve('./dist'),
    emptyOutDir: true,
  },
});
