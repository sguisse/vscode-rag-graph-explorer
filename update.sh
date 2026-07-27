#!/usr/bin/env bash
set -e

# Ensure webview target directory exists
mkdir -p src/webview dist/webview

# 1. Simplified index.html referencing index.tsx directly
cat << 'EOF' > src/webview/index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Graph RAG Explorer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./index.tsx"></script>
  </body>
</html>
EOF

# 2. Consolidated React entry point combining main.tsx and index.tsx
cat << 'EOF' > src/webview/index.tsx
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
EOF

# 3. Remove redundant main.tsx file
rm -f src/webview/main.tsx

# 4. Update vite.config.ts for clean index.html bundling
cat << 'EOF' > vite.config.ts
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
EOF

# 5. Recompile project
if command -v npm >/dev/null 2>&1; then
  npm run compile
fi

echo "✅ refactor: Simplified Webview entry structure into src/webview/index.html and src/webview/index.tsx, removing redundant main.tsx."
