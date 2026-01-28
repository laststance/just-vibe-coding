const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * Build configuration for the main extension.
 */
const extensionConfig = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  format: 'cjs',
  minify: production,
  sourcemap: !production,
  sourcesContent: false,
  platform: 'node',
  outfile: 'dist/extension.js',
  external: ['vscode'],
  logLevel: 'info',
};

/**
 * Build configuration for test files.
 * Note: bundle=false means external is not needed (modules resolved at runtime)
 */
const testConfig = {
  entryPoints: ['test/runTest.ts', 'test/suite/index.ts', 'test/suite/extension.test.ts'],
  bundle: false,
  format: 'cjs',
  sourcemap: true,
  platform: 'node',
  outdir: 'dist/test',
  outbase: 'test',
  logLevel: 'info',
};

async function main() {
  // Build extension
  const extCtx = await esbuild.context(extensionConfig);

  // Build tests (only in non-production)
  const testCtx = production ? null : await esbuild.context(testConfig);

  if (watch) {
    await extCtx.watch();
    if (testCtx) await testCtx.watch();
    console.log('Watching for changes...');
  } else {
    await extCtx.rebuild();
    if (testCtx) await testCtx.rebuild();
    await extCtx.dispose();
    if (testCtx) await testCtx.dispose();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
