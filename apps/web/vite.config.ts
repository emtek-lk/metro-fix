import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
      interval: 250,
      // Keep workspace packages hot-reloadable without relying on inotify limits.
      ignored: ['!**/packages/ui/**', '!**/packages/core-types/**'],
    },
  },
  resolve: {
    alias: {
      // Prevents multiple conflicting copies of React from loading in the dependency graph
      react: path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('@tanstack/react-table')) {
              return 'vendor-tanstack';
            }
            if (id.includes('@hello-pangea/dnd')) {
              return 'vendor-dnd';
            }
            if (id.includes('zod') || id.includes('react-hook-form') || id.includes('@hookform/resolvers')) {
              return 'vendor-forms';
            }
          }
        },
      },
    },
  },
});