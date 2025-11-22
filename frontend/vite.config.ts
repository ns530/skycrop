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
    sourcemap: false, // Disable source maps in production for smaller bundles
    target: 'es2015',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - npm packages
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'map-vendor';
            }
            if (id.includes('axios')) {
              return 'http-vendor';
            }
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }
            // All other node_modules go to common vendor chunk
            return 'vendor';
          }

          // Route-based code splitting for features
          if (id.includes('/features/auth/')) {
            return 'feature-auth';
          }
          if (id.includes('/features/fields/')) {
            return 'feature-fields';
          }
          if (id.includes('/features/health/')) {
            return 'feature-health';
          }
          if (id.includes('/features/recommendations/')) {
            return 'feature-recommendations';
          }
          if (id.includes('/features/weather/')) {
            return 'feature-weather';
          }
          if (id.includes('/features/yield/')) {
            return 'feature-yield';
          }
          if (id.includes('/features/admin/')) {
            return 'feature-admin';
          }
          if (id.includes('/features/news/')) {
            return 'feature-news';
          }
          
          // Shared components in separate chunk
          if (id.includes('/shared/')) {
            return 'shared';
          }
        },
        // Optimize chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit for maps
    chunkSizeWarningLimit: 600,
  },
});