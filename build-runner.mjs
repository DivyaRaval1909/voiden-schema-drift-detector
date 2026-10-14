#!/usr/bin/env node
import { build } from 'esbuild';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';

const manifest = JSON.parse(readFileSync('./manifest.json', 'utf8'));
const pluginId = manifest.id;
const entry = './src/runner.ts';

if (!existsSync(entry)) {
  console.error('No src/runner.ts found — skipping runner build');
  process.exit(0);
}

await build({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: `dist/${pluginId}-runner.js`,
  external: [
    '@voiden/sdk',
    '@voiden/sdk/runner',
    '@voiden/executors',
    'electron',
    'node:*',
    'child_process', 'fs', 'path', 'os', 'http', 'https', 'net',
    'crypto', 'worker_threads', 'stream', 'events', 'util', 'url', 'buffer',
  ],
  minify: true,
});

mkdirSync('dist', { recursive: true });
writeFileSync('dist/package.json', JSON.stringify({ type: 'commonjs' }, null, 2) + '\n');

console.log(`Built dist/${pluginId}-runner.js — publish this as a "${pluginId}-runner.js" GitHub release asset.`);
console.log(`Users install it with: voiden-runner plugin install ${manifest.id}`);
