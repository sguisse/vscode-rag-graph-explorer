#!/usr/bin/env bash
set -e

# 1. Update tsconfig.json to use modern 'bundler' module resolution for Vite compatibility
cat << 'EOF' > tsconfig.json
{
  "compilerOptions": {
    "module": "ESNext",
    "target": "ES2022",
    "outDir": "dist",
    "lib": ["ES2022", "DOM"],
    "types": ["node"],
    "sourceMap": true,
    "inlineSources": true,
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "src/webview/*",
        "src/*"
      ]
    },
    "jsx": "react-jsx",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true
  },
  "include": [
    "src/**/*",
    "vite.config.ts",
    "esbuild.js"
  ],
  "exclude": [
    "node_modules",
    ".vscode-test",
    "sandbox",
    "zz-tmp"
  ]
}
EOF

# 2. Recompile project
if command -v npm >/dev/null 2>&1; then
  npm run compile
fi

echo "✅ fix: Set tsconfig moduleResolution to 'bundler' and module to 'ESNext' to support Vite module declarations."
