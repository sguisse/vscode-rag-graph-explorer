import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

const webviewInput = {
  main: resolve(__dirname, 'src/webview/index.html')
};

const externalDeps = ['vscode', 'util', 'node:util'];

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    react()
  ],
  resolve: {
    alias: {
      'vscode': resolve(__dirname, 'src/webview/mocks/vscode.ts'),
      'util': resolve(__dirname, 'src/webview/mocks/util.ts'),
      'node:util': resolve(__dirname, 'src/webview/mocks/util.ts'),
      '@/backend': resolve(__dirname, 'src/backend'),
      '@/common': resolve(__dirname, 'src/common'),
      '@/webview': resolve(__dirname, 'src/webview'),
      '@': resolve(__dirname, 'src/webview')
    }
  },
  base: command === 'serve' ? 'http://127.0.0.1:5173/' : './',
  build: {
    outDir: 'dist/webview',
    emptyOutDir: true,
    assetsInlineLimit: 10485760,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      external: externalDeps,
      input: webviewInput,
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    },
    rolldownOptions: {
      external: externalDeps,
      input: webviewInput,
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
    origin: 'http://127.0.0.1:5173',
    hmr: {
      host: '127.0.0.1',
      port: 5173,
      protocol: 'ws'
    }
  }
}));
