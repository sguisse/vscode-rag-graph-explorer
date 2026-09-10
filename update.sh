#!/usr/bin/env bash
set -e

echo "🚀 Installing esbuild dependency..."
npm install --save-dev esbuild

echo "📦 Creating backend esbuild configuration (dev-tools/esbuild.js)..."
mkdir -p dev-tools

cat << 'EOF' > dev-tools/esbuild.js
const esbuild = require('esbuild');

const isWatch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  entryPoints: ['backend/src/extension.ts'],
  bundle: true,
  outfile: 'dist-backend/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: true,
  minify: false,
  logLevel: 'info',
};

async function run() {
  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('⚡ Watching backend for changes...');
  } else {
    await esbuild.build(buildOptions);
    console.log('✅ Backend successfully bundled into dist-backend/extension.js');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
EOF

echo "⚙️ Updating root package.json entry point and scripts..."
node -e '
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));

pkg.main = "./dist-backend/extension.js";
pkg.scripts["build:backend"] = "npm run generate:code && node dev-tools/esbuild.js";
pkg.scripts["watch:backend"] = "node dev-tools/esbuild.js --watch";

fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
'

echo "⚙️ Updating .vscode/launch.json outFiles..."
node -e '
const fs = require("fs");
const launchPath = ".vscode/launch.json";

if (fs.existsSync(launchPath)) {
  const launch = JSON.parse(fs.readFileSync(launchPath, "utf-8"));
  if (launch.configurations && launch.configurations[0]) {
    launch.configurations[0].outFiles = ["${workspaceFolder}/dist-backend/*.js"];
  }
  fs.writeFileSync(launchPath, JSON.stringify(launch, null, 2));
}
'

echo "🧹 Cleaning and compiling project..."
rm -rf dist-backend dist-webview
npm run build

echo "✅ fix(vsix): Configured esbuild backend bundler to resolve missing node_modules and ESM module loading crashes!"
