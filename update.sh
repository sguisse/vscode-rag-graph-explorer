#!/bin/bash
set -e

echo "🔧 Résolution des erreurs de compilation TypeScript dans la Webview..."

# 1. Configuration de webview/tsconfig.json (Ciblage strict de src/ et exclusion de vite.config.ts)
cat << 'EOF' > webview/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "vite.config.ts",
    "../dist-webview"
  ]
}
EOF

# 2. Configuration séparée pour Vite (tsconfig.node.json)
cat << 'EOF' > webview/tsconfig.node.json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": [
    "vite.config.ts"
  ]
}
EOF

# 3. Mise à jour du script de build dans webview/package.json
cat << 'EOF' > webview/package.json
{
  "name": "webview-ui",
  "private": true,
  "version": "1.5.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.json && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@base-ui/react": "^1.6.0",
    "@fontsource-variable/inter": "^5.3.0",
    "@fontsource-variable/jetbrains-mono": "^5.3.0",
    "@fontsource-variable/source-serif-4": "^5.3.0",
    "@primer/octicons-react": "^19.31.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cytoscape": "^3.34.0",
    "lucide-react": "^1.27.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "zustand": "^5.0.14"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.3.3",
    "@tailwindcss/vite": "^4.3.3",
    "@types/node": "^26.1.2",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.4",
    "postcss": "^8.5.23",
    "tailwind-merge": "^3.6.0",
    "tailwindcss": "^4.3.3",
    "typescript": "^5.1.3",
    "vite": "^8.1.5"
  }
}
EOF

# 4. Nettoyage et réinstallation des dépendances webview
echo "📥 Installation des dépendances webview..."
cd webview
npm install

echo "🛠️ Compilation de la webview..."
npm run build
cd ..

echo "✅ fix(webview): tsconfig isolé créé avec succès, compilation de la Webview validée sans erreur !"
