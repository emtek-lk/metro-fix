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
      ignored: ['!**/packages/ui/**', '!**/packages/core-types/**']
    }
  },
  resolve: {
    alias: {
      // Prevents multiple conflicting copies of React from loading in the dependency graph
      'react': path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom')
    }
  }
});