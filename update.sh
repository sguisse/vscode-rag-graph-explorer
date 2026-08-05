#!/usr/bin/env bash
# Make script exit if a command fails
set -e

echo "Starting fixes for Vite asset resolution (403 Forbidden)..."

# Provide FULL updated Vite configuration
cat << 'EOF' > webview/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]"
      }
    }
  }
});
EOF

echo "- Updated webview/vite.config.ts"

echo "✅ fix: Enforced absolute 'localhost' base URLs for assets and disabled Vite's strict FS to unblock fonts/images!"
echo ""
echo "CRITICAL NEXT STEPS:"
echo "1. Stop your currently running Vite dev server in the terminal."
echo "2. Restart it: cd webview && npm run dev"
echo "3. Restart the VS Code Extension Development Host (Ctrl+R / Cmd+R in the dev window)."
