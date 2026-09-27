#!/usr/bin/env node
// Each tool must declare every package it imports, so it installs and runs
// on its own once published, not only inside this workspace.
import { builtinModules } from 'node:module';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const builtins = new Set(builtinModules.flatMap((m) => [m, `node:${m}`]));
const IMPORT = /(?:import\s[^'"]*?from\s*|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : [];
  });
}

let failed = 0;
for (const tool of readdirSync(join(repo, 'tools'))) {
  const dir = join(repo, 'tools', tool);
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const declared = new Set(Object.keys(pkg.dependencies ?? {}));
  for (const sub of ['lib', 'bin']) {
    let files = [];
    try { files = walk(join(dir, sub)); } catch { continue; }
    for (const file of files) {
      for (const [, spec] of readFileSync(file, 'utf8').matchAll(IMPORT)) {
        if (spec.startsWith('.') || builtins.has(spec)) continue;
        const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
        if (!declared.has(name)) {
          console.error(`FAIL tools/${tool}: ${file.slice(dir.length + 1)} imports "${name}", which package.json does not declare`);
          failed++;
        }
      }
    }
  }
}
if (failed > 0) process.exitCode = 1;
else console.log('Every tool declares the packages it imports.');
