import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/ml': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['clsx'],

          // Feature chunks
          'auth': [
            './src/features/auth',
          ],
          'fields': [
            './src/features/fields',
          ],
          'yield': [
            './src/features/yield',
          ],
          'health': [
            './src/features/health',
          ],
          'weather': [
            './src/features/weather',
          ],
          'recommendations': [
            './src/features/recommendations',
          ],
          'admin': [
            './src/features/admin',
          ],
        },
      },
    },
  },
});