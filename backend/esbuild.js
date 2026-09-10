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
