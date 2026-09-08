// Verifies every relative Markdown link in a tracked .md file resolves on
// disk, and that any "#fragment" matches a real heading in the target file.
//
// This exists so that moving specification documents (and the ~100 inbound
// cross-references that point at them) is a mechanically verifiable change
// rather than a hand-audited one. External (http/https/mailto) links are not
// fetched -- this checks repository-internal referential integrity only.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const root = process.cwd();

let failed = false;
let checked = 0;

function fail(message) {
  failed = true;
  console.error(`[FAIL] ${message}`);
}

function trackedMarkdownFiles() {
  return execFileSync('git', ['ls-files', '*.md'], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

// GitHub's heading-anchor slug: lowercase, drop punctuation other than
// hyphens/underscores, spaces to hyphens, de-duplicated with a numeric
// suffix. Repeated spaces are preserved as repeated hyphens, which is why
// "8.2 Security & Trust Boundary Rule" anchors as "82-security--trust-boundary-rule".
function slugify(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_\- ]+/gu, '')
    .replace(/ /g, '-');
}

// Strips fenced code blocks so that headings and link-like text inside
// examples (the spec embeds sample Markdown documents) are not mistaken for
// real headings or real links.
function stripFences(source) {
  const lines = source.split('\n');
  const kept = [];
  let fence = null;
  for (const line of lines) {
    const match = /^\s*(```+|~~~+)/.exec(line);
    if (match) {
      const marker = match[1][0];
      if (fence === null) {
        fence = marker;
        kept.push('');
        continue;
      }
      if (fence === marker) {
        fence = null;
        kept.push('');
        continue;
      }
    }
    kept.push(fence === null ? line : '');
  }
  return kept.join('\n');
}

const anchorCache = new Map();

function anchorsFor(absPath) {
  if (anchorCache.has(absPath)) return anchorCache.get(absPath);

  const anchors = new Set();
  if (absPath.endsWith('.md') && existsSync(absPath) && statSync(absPath).isFile()) {
    const body = stripFences(readFileSync(absPath, 'utf8'));
    const seen = new Map();
    for (const line of body.split('\n')) {
      const match = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
      if (!match) continue;
      const base = slugify(match[2]);
      if (base.length === 0) continue;
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      anchors.add(count === 0 ? base : `${base}-${count}`);
    }
  }

  anchorCache.set(absPath, anchors);
  return anchors;
}

function isExternal(target) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target);
}

// Matches [text](target) and ![alt](target), ignoring the optional
// "title" some Markdown links carry after the target.
const LINK_PATTERN = /!?\[(?:[^\]\\]|\\.)*\]\(\s*(<[^>]*>|[^()\s]+(?:\([^()\s]*\)[^()\s]*)*)\s*(?:"[^"]*"|'[^']*')?\s*\)/g;

for (const file of trackedMarkdownFiles()) {
  const absFile = join(root, file);
  const body = stripFences(readFileSync(absFile, 'utf8'));

  for (const match of body.matchAll(LINK_PATTERN)) {
    let target = match[1].trim();
    if (target.startsWith('<') && target.endsWith('>')) {
      target = target.slice(1, -1).trim();
    }
    if (target.length === 0 || isExternal(target)) continue;

    checked += 1;

    const hashIndex = target.indexOf('#');
    const pathPart = hashIndex === -1 ? target : target.slice(0, hashIndex);
    const fragment = hashIndex === -1 ? '' : decodeURIComponent(target.slice(hashIndex + 1));

    const absTarget = pathPart === ''
      ? absFile
      : resolve(dirname(absFile), decodeURIComponent(pathPart));

    if (!existsSync(absTarget)) {
      fail(`${file}: link target "${target}" does not exist (resolved to ${relative(root, absTarget)})`);
      continue;
    }

    if (fragment === '') continue;

    if (!statSync(absTarget).isFile() || !absTarget.endsWith('.md')) {
      fail(`${file}: link "${target}" has a #fragment but its target is not a Markdown file`);
      continue;
    }

    const anchors = anchorsFor(absTarget);
    if (!anchors.has(fragment)) {
      fail(`${file}: link "${target}" points at no heading in ${relative(root, absTarget)}`);
    }
  }
}

if (failed) {
  console.error(`\nLink validation failed (${checked} internal link(s) checked).`);
  process.exit(1);
}

console.log(`[OK]   ${checked} internal Markdown link(s) resolve, including heading anchors.`);
console.log('\nLink validation succeeded.');
