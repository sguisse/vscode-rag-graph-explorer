import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    react()
  ],
  resolve: {
    alias: {
      '@/backend': resolve(__dirname, 'src/backend'),
      '@/common': resolve(__dirname, 'src/common'),
      '@': resolve(__dirname, 'src/webview')
    }
  },
  base: command === 'serve' ? 'http://127.0.0.1:5173/' : './',
  build: {
    outDir: 'dist/webview',
    emptyOutDir: true,
    // Inline images up to 10MB as Base64 Data URIs for standalone production webviews
    assetsInlineLimit: 10485760,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/webview/index.html')
      },
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    cors: true,
    // CRITICAL FOR VS CODE WEBVIEWS: Force Vite dev server to prefix all asset imports
    // with http://127.0.0.1:5173 so the webview doesn't try to fetch them from vscode-webview:// (403 Forbidden)
    origin: 'http://127.0.0.1:5173',
    hmr: {
      host: '127.0.0.1',
      port: 5173,
      protocol: 'ws'
    }
  }
}));
