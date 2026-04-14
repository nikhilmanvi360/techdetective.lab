import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function build() {
  try {
    await esbuild.build({
      entryPoints: ['server.ts'],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile: 'dist/server.cjs',
      external: ['better-sqlite3', 'express', 'vite'],
    });
    console.log('Server built successfully');
  } catch (error) {
    console.error('Server build failed:', error);
    process.exit(1);
  }
}

build();
