import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Force Vite to watch code updates inside your packages directory
      ignored: ['!**/packages/ui/**']
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