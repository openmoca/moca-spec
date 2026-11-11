#!/usr/bin/env node
// Runs a getting-started guide as written, so a guide that stops working fails CI.
//
// Usage: node scripts/run-guide.mjs <guide.md> [--replace "<text>=><replacement>"]... [--keep]
//
// The guide's fenced code blocks, in order, become one bash script, run with
// `set -euo pipefail` in a new empty folder:
//   - a block whose info string has title="<path>" is written to that file,
//     relative to the current folder at that point in the guide;
//   - a sh, shell, bash or console block is run;
//   - a block with `skip` in its info string, and any other block, is left out
//     (expected output, illustrations).
//
// --replace swaps text in the commands before they run, for what the guide
// cannot do yet: before the first npm or NuGet publish, install the Reader
// packed from the same commit instead of the published one, and copy files
// instead of downloading them from a private release. Each Reader's CI passes
// its own replacements. With none, the guide runs exactly as a reader would.
//
// Environment variables set when the script runs are available to the guide's
// commands as usual. Node built-ins only.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const guide = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--replace');
if (!guide) {
  console.error('Usage: node scripts/run-guide.mjs <guide.md> [--replace "<text>=><replacement>"]... [--keep]');
  process.exit(2);
}
const replacements = args.flatMap((a, i) => (a === '--replace' ? [args[i + 1]] : [])).map((r) => {
  const at = r.indexOf('=>');
  if (at < 0) throw new Error(`--replace needs "<text>=><replacement>": ${r}`);
  return [r.slice(0, at), r.slice(at + 2)];
});
const keep = args.includes('--keep');

const RUN = new Set(['sh', 'shell', 'bash', 'console']);
const blocks = [];
let open = null;
for (const line of readFileSync(resolve(guide), 'utf8').split('\n')) {
  const fence = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
  if (!open && fence) {
    const info = fence[3].trim();
    open = { marker: fence[2], indent: fence[1].length, lang: info.split(/\s+/)[0], info, lines: [] };
  } else if (open && fence && fence[2].startsWith(open.marker) && fence[3].trim() === '') {
    blocks.push(open);
    open = null;
  } else if (open) {
    open.lines.push(line.slice(Math.min(open.indent, line.search(/\S|$/))));
  }
}
if (open) throw new Error(`${guide}: a code block is not closed`);

let script = 'set -euo pipefail\n';
const used = new Set();
let steps = 0;
let runs = 0;
for (const b of blocks) {
  if (/\bskip\b/.test(b.info)) continue;
  const title = b.info.match(/title="([^"]+)"/)?.[1];
  const body = b.lines.join('\n');
  if (title) {
    script += `mkdir -p "$(dirname '${title}')"\ncat > '${title}' <<'MOCA_GUIDE_EOF'\n${body}\nMOCA_GUIDE_EOF\n`;
    steps++;
  } else if (RUN.has(b.lang)) {
    let commands = body;
    for (const [from, to] of replacements) {
      if (commands.includes(from)) used.add(from);
      commands = commands.split(from).join(to);
    }
    steps++;
    script += `echo '--- guide command block ${++runs}'\n${commands}\n`;
  }
}
const unused = replacements.filter(([from]) => !used.has(from));
if (unused.length) {
  // A replacement that matches nothing means the guide changed: fail rather than test the wrong thing.
  for (const [from] of unused) console.error(`--replace text not found in any command: ${from}`);
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), 'moca-guide-'));
console.log(`Running ${steps} step(s) of ${guide} in ${work}`);
const run = spawnSync('bash', ['-c', script], { cwd: work, stdio: 'inherit' });
if (!keep) rmSync(work, { recursive: true, force: true });
if (run.status !== 0) {
  console.error(`\n${guide}: a step failed (exit ${run.status}).`);
  process.exit(1);
}
console.log(`\n${guide}: every step ran.`);
