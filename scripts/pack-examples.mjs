#!/usr/bin/env node
// Packs every example package into a .moca file, for the release (docs/releasing.md), and checks each one:
// moca-lint finds no errors, and the file has the same digest as its folder. It also writes the example
// trust root, which verifies support-kb's signatures, as example-trust-root.json, and a semantic index for
// acme-support built with the standard model bge-small-en-v1.5, as acme-support.bge-small-en-v1.5.moca.idx.zip.
// The index needs that model installed (npx @openmoca/moca-embed models add bge-small-en-v1.5); --check skips it,
// with a note, when the model is not installed.
//
// Usage:
//   node scripts/pack-examples.mjs              write dist/examples/
//   node scripts/pack-examples.mjs --out <dir>  write them somewhere else
//   node scripts/pack-examples.mjs --check      pack into a temporary folder, check, and remove it
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lintBin = join(root, 'node_modules', '@openmoca', 'moca-lint', 'bin', 'moca-lint.js');
const indexBin = join(root, 'node_modules', '@openmoca', 'moca-index', 'bin', 'moca-index.js');
const trustRoot = join(root, 'fixtures', 'signing-keys', 'trust-root.json');

// Each example package and the file it is released as. The file names are in the download links in the
// examples' READMEs and on openmoca.org, so keep them stable.
const EXAMPLES = [
  ['minimal', 'minimal.moca'],
  ['support-kb', 'support-kb.moca'],
  ['acme-support', 'acme-support.moca'],
  ['policy-corpus/retention-2025', 'policy-corpus-retention-2025.moca'],
  ['policy-corpus/retention-2026', 'policy-corpus-retention-2026.moca'],
  ['handbook/handbook', 'handbook.moca'],
  ['handbook/incident-response', 'handbook-incident-response.moca'],
  ['handbook/service-ownership', 'handbook-service-ownership.moca'],
  ['pdf/airplane-flying-handbook', 'airplane-flying-handbook.moca'],
  ['youtube/video', 'youtube-video.moca'],
  ['youtube/playlist', 'youtube-playlist.moca'],
];

const args = process.argv.slice(2);
const check = args.includes('--check');
const outArg = args.indexOf('--out');
const out = check
  ? mkdtempSync(join(tmpdir(), 'moca-examples-'))
  : resolve(outArg >= 0 ? args[outArg + 1] : join(root, 'dist', 'examples'));

const lint = (...a) => execFileSync(process.execPath, [lintBin, ...a], { cwd: root, encoding: 'utf8' });
const digestOf = (path) => lint('digest', path).trim();
const index = (...a) => execFileSync(process.execPath, [indexBin, ...a], { cwd: root, encoding: 'utf8', stdio: 'pipe' });

// The examples' semantic index: its name says which model it needs, which is how the MCP server finds it.
const SEMANTIC = { package: 'acme-support.moca', model: 'bge-small-en-v1.5', file: 'acme-support.bge-small-en-v1.5.moca.idx.zip' };
const modelStore = process.env.MOCA_MODELS || join(homedir(), '.moca', 'models');

let failed = false;
try {
  mkdirSync(out, { recursive: true });
  const rows = [];
  for (const [dir, file] of EXAMPLES) {
    const folder = join('examples', dir);
    const target = join(out, file);
    try {
      lint('pack', folder, '-o', target, '--trust-root', trustRoot);
      // A composed package names its members; lint finds them among the folders beside it.
      lint('lint', target, '--trust-root', trustRoot, '--members', dirname(folder));
      const digest = digestOf(target);
      if (digest !== digestOf(folder)) throw new Error(`${file} has digest ${digest}, but its folder does not`);
      rows.push([file, `${Math.ceil(statSync(target).size / 1024)} KB`, digest]);
    } catch (error) {
      failed = true;
      console.error(`${file}: ${(error.stdout || '') + (error.stderr || '') || error.message}`);
    }
  }
  if (!existsSync(join(modelStore, SEMANTIC.model)) && check) {
    console.log(`(${SEMANTIC.file} not checked: ${SEMANTIC.model} is not installed in ${modelStore})`);
  } else if (rows.some(([file]) => file === SEMANTIC.package)) {
    const pkg = join(out, SEMANTIC.package);
    const target = join(out, SEMANTIC.file);
    try {
      index('build', pkg, '-o', target, '--zip', '--force', '--chunk', 'headings', '--model', SEMANTIC.model);
      const report = index('check', target, '--package', pkg);
      if (!/Usable: \d+ chunk/.test(report)) throw new Error(report);
      rows.push([SEMANTIC.file, `${Math.ceil(statSync(target).size / 1024)} KB`, `${SEMANTIC.model}, bound to ${SEMANTIC.package}`]);
    } catch (error) {
      failed = true;
      console.error(`${SEMANTIC.file}: ${(error.stdout || '') + (error.stderr || '') || error.message}`);
    }
  }
  copyFileSync(trustRoot, join(out, 'example-trust-root.json'));
  for (const [file, size, digest] of rows) console.log(`${file.padEnd(44)} ${size.padStart(7)}  ${digest}`);
  console.log(failed ? '\nSome examples failed.' : `\n${rows.length} example files${check ? ' checked' : ` in ${out}`}.`);
} finally {
  if (check) rmSync(out, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
