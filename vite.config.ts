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
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return candidate;
          }
        }

        for (const ext of extensions) {
          const candidate = path.resolve(__dirname, 'src', subPath + ext);
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return candidate;
          }
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
});
