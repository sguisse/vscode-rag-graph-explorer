const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const polyfillBanner = `
if (typeof globalThis.document === 'undefined') {
  const dummy = function() {
    return {
      style: {},
      setAttribute: function() {},
      getAttribute: function() { return null; },
      removeAttribute: function() {},
      appendChild: function(c) { return c; },
      removeChild: function() {},
      addEventListener: function() {},
      removeEventListener: function() {},
      querySelector: function() { return null; },
      querySelectorAll: function() { return []; },
      getElementsByTagName: function() { return []; },
      classList: { add: function() {}, remove: function() {} }
    };
  };
  globalThis.document = {
    createElement: dummy,
    createElementNS: dummy,
    createTextNode: function() { return { style: {} }; },
    getElementsByTagName: function() { return []; },
    getElementById: function() { return null; },
    querySelector: function() { return null; },
    querySelectorAll: function() { return []; },
    addEventListener: function() {},
    removeEventListener: function() {},
    head: dummy(),
    body: dummy()
  };
}
if (typeof globalThis.window === 'undefined') {
  globalThis.window = globalThis;
}
if (typeof globalThis.navigator === 'undefined') {
  globalThis.navigator = { userAgent: 'node' };
}
`;

async function main() {
  const isWatch = process.argv.includes('--watch');

  const extensionConfig = {
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    loader: {
      '.css': 'empty',
      '.ttf': 'empty',
      '.woff': 'empty',
      '.woff2': 'empty'
    },
    banner: {
      js: polyfillBanner,
    },
    sourcemap: 'inline',
    sourcesContent: true,
  };

  if (isWatch) {
    const ctx = await esbuild.context(extensionConfig);
    await ctx.watch();
    console.log('⚡ Watching extension host...');
  } else {
    await esbuild.build(extensionConfig);
    console.log('✅ Extension host compiled successfully.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
