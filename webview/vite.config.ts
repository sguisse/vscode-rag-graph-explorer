import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import ViteYaml from '@modyfi/vite-plugin-yaml';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss(), ViteYaml()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@assets': path.resolve(import.meta.dirname, '../assets'),
      '@/shared': path.resolve(import.meta.dirname, '../shared'),
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // CRITICAL: Force Vite to use the dev server URL for all assets (fonts, images)
  // This prevents the webview from attempting to load them via 'vscode-webview://'
  base: process.env.NODE_ENV === 'production' ? './' : 'http://localhost:5173/',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    origin: 'http://localhost:5173', // Prepend origin to HMR and asset requests
    fs: {
      strict: false, // Allow serving files outside of the webview root (like ../assets)
    },
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["X-Requested-With", "content-type", "Authorization"],
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },
  build: {
    outDir: '../dist-webview',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('cytoscape')) {
              return 'vendor-cytoscape';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('zustand')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
