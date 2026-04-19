import * as esbuild from 'esbuild';

async function build() {
  try {
    await esbuild.build({
      entryPoints: ['server.ts'],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile: 'dist/server.cjs',
      // Mark these as external so they use the installed node_modules at runtime
      external: [
        'better-sqlite3', 'vite',
        // All engine/src files are bundled in, so just mark heavy native deps
      ],
      // Bundle all engine files into the output
      packages: 'bundle',
    });
    console.log('✅ Server bundled successfully to dist/server.cjs');
  } catch (error) {
    console.error('❌ Server build failed:', error);
    process.exit(1);
  }
}

build();
