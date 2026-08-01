const esbuild = require('esbuild');

const watchLoggerPlugin = {
  name: 'watch-logger',
  setup(build) {
    build.onStart(() => {
      console.log('⚡ [esbuild] Rebuilding extension host...');
    });
    build.onEnd((result) => {
      if (result.errors.length > 0) {
        console.error('❌ [esbuild] Build failed:', result.errors);
      } else {
        console.log('✅ [esbuild] Extension host compiled successfully.');
      }
    });
  },
};

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
    sourcemap: true,
    plugins: [watchLoggerPlugin],
  };

  if (isWatch) {
    const ctx = await esbuild.context(extensionConfig);
    await ctx.watch();
    console.log('[esbuild] ⚡ Watching extension host...');
  } else {
    await esbuild.build(extensionConfig);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
