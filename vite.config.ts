import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

function dynamicAliasResolver(): Plugin {
  return {
    name: 'dynamic-alias-resolver',
    resolveId(source) {
      if (source.startsWith('@/')) {
        const subPath = source.slice(2);
        const extensions = [
          '', '.tsx', '.ts', '.jsx', '.js', '.json', '.css',
          '/index.tsx', '/index.ts', '/index.jsx', '/index.js', '/index.css'
        ];
        for (const ext of extensions) {
          const candidate = path.resolve(__dirname, 'src/webview', subPath + ext);
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
        }
        for (const ext of extensions) {
          const candidate = path.resolve(__dirname, 'src', subPath + ext);
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
        }
        return path.resolve(__dirname, 'src/webview', subPath);
      }
      return null;
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [tailwindcss(), react(), dynamicAliasResolver()],
  root: path.resolve(__dirname, 'src/webview'),
  build: {
    outDir: path.resolve(__dirname, 'dist/webview'),
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 104857600, // Forces Vite to inline images as Base64 to bypass VS Code Webview URI restrictions in production
    rollupOptions: {
      input: path.resolve(__dirname, 'src/webview/index.html'),
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  resolve: {
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.css'],
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    cors: {
      origin: '*',
      methods: ['GET', 'OPTIONS']
    },
    origin: 'http://127.0.0.1:5173', // Forces Vite to output absolute URLs for assets in development
    hmr: {
      host: '127.0.0.1',
      protocol: 'ws',
      port: 5173
    }
  },
});
