const esbuild = require('esbuild');

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
