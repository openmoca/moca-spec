#!/usr/bin/env node
// Every relative link in the repository's Markdown must point at a file or
// directory that exists, and every #anchor into a Markdown file must match a
// heading in it.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', '.git', '.claude']);
// Conformance fixtures contain deliberately broken links.
const SKIP_DIRS = [join(repo, 'conformance', 'fixtures')];
const LINK = /\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+"[^"]*")?\s*\)/g;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (SKIP.has(name) || SKIP_DIRS.includes(p)) return [];
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
  });
}

function slug(heading) {
  return heading.trim().toLowerCase().replace(/[`*_~]/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-');
}

const anchorCache = new Map();
function anchors(file) {
  if (!anchorCache.has(file)) {
    const set = new Set();
    let fence = false;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (/^\s*(```|~~~)/.test(line)) fence = !fence;
      const m = !fence && line.match(/^#{1,6}\s+(.*)$/);
      if (m) set.add(slug(m[1]));
    }
    anchorCache.set(file, set);
  }
  return anchorCache.get(file);
}

let checked = 0;
const failures = [];
for (const file of walk(repo)) {
  let fence = false;
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (fence) return;
    for (const m of line.replace(/`[^`]*`/g, '').matchAll(LINK)) {
      const target = m[1].replace(/^<|>$/g, '');
      if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
      checked++;
      const [pathPart, anchor] = target.split('#');
      const dest = pathPart ? resolve(dirname(file), decodeURIComponent(pathPart)) : file;
      const where = `${relative(repo, file)}:${i + 1}`;
      if (!existsSync(dest)) {
        failures.push(`${where} -> ${target} (missing)`);
        continue;
      }
      if (anchor && dest.endsWith('.md') && !anchors(dest).has(anchor)) failures.push(`${where} -> ${target} (no such heading)`);
    }
  });
}
if (failures.length > 0) {
  console.error(failures.map((f) => `FAIL ${f}`).join('\n'));
  console.error(`\n${failures.length} broken link(s) of ${checked} checked.`);
  process.exitCode = 1;
} else {
  console.log(`${checked} relative link(s) resolve.`);
}
