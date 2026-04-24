import { spawnSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const tscBin = require.resolve('typescript/bin/tsc');

async function build() {
  try {
    const result = spawnSync(
      process.execPath,
      [tscBin, '-p', 'tsconfig.server.json'],
      {
        stdio: 'inherit',
        env: process.env,
      }
    );

    if (result.status !== 0) {
      throw new Error(`tsc exited with code ${result.status ?? 'unknown'}`);
    }

    console.log('✅ Server compiled successfully to dist/server');
  } catch (error) {
    console.error('❌ Server build failed:', error);
    process.exit(1);
  }
}

build();
