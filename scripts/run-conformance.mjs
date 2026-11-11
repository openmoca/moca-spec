#!/usr/bin/env node
// Runs conformance/cases.json against a Reader and compares its conclusions
// with the expected ones. See conformance/README.md.
//
//   node scripts/run-conformance.mjs                  the reference Reader, in process
//   node scripts/run-conformance.mjs --reader "<cmd>" another Reader, through the runner protocol
//   node scripts/run-conformance.mjs --without sigstore
//                                                     skip cases that need an optional feature the
//                                                     Reader names as not implemented (contract §14)
//   node scripts/run-conformance.mjs --actual         print what the Reader concludes,
//                                                     to help review a new case
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgainst } from '@openmoca/moca-core';
import { actualFor } from './conformance-adapter.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'conformance');
const corpus = JSON.parse(readFileSync(join(root, 'cases.json'), 'utf8'));
const args = process.argv.slice(2);
const showActual = args.includes('--actual');
const readerAt = args.indexOf('--reader');
const readerCommand = readerAt >= 0 ? args[readerAt + 1] : null;
// Reader contract §14: a Reader names the optional features it does not implement, and skips the cases that need them.
const without = new Set(args.flatMap((a, i) => (a === '--without' ? args[i + 1].split(',') : [])));
const byId = new Map(corpus.cases.map((c) => [c.id, c]));

const uniqueSorted = (xs) => [...new Set(xs)].sort();
const same = (a, b) => JSON.stringify(uniqueSorted(a)) === JSON.stringify(uniqueSorted(b));
const keyOf = (r) => r.node.ref;

async function run(c) {
  if (!readerCommand) return actualFor(root, c);
  const out = spawnSync(readerCommand, { shell: true, input: JSON.stringify({ root, case: c }), encoding: 'utf8' });
  if (out.status !== 0) throw new Error(`reader exited ${out.status} on ${c.id}: ${out.stderr}`);
  return JSON.parse(out.stdout);
}

function checkPackage(e, actual) {
  const problems = [];
  if (e.valid !== actual.valid) problems.push(`valid: expected ${e.valid}, got ${actual.valid}`);
  if (!same(e.codes, actual.codes)) problems.push(`codes: expected [${uniqueSorted(e.codes)}], got [${uniqueSorted(actual.codes)}]`);
  if (!same(e.capabilities, actual.capabilities)) problems.push(`capabilities: expected [${uniqueSorted(e.capabilities)}], got [${uniqueSorted(actual.capabilities)}]`);
  if (e.digest) {
    const want = e.digest.startsWith('SAME:') ? byId.get(e.digest.slice(5))?.expect.digest : e.digest;
    if (want !== actual.digest) problems.push(`digest: expected ${want}, got ${actual.digest}`);
  }
  if (e.sidecarUsable !== undefined && e.sidecarUsable !== actual.sidecarUsable) {
    problems.push(`sidecarUsable: expected ${e.sidecarUsable}, got ${actual.sidecarUsable}`);
  }
  for (const [path, want] of Object.entries(e.evidenceMatched ?? {})) {
    const got = actual.evidenceMatched?.[path];
    if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`evidenceMatched ${path}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
  }
  return problems;
}

function checkSearch(e, actual) {
  const problems = [];
  const records = actual.records ?? [];
  const keys = new Set(records.map(keyOf));
  if (!same(e.codes ?? [], actual.codes ?? [])) problems.push(`codes: expected [${uniqueSorted(e.codes ?? [])}], got [${uniqueSorted(actual.codes ?? [])}]`);
  for (const k of e.include ?? []) if (!keys.has(k)) problems.push(`missing ${k}`);
  for (const k of e.exclude ?? []) if (keys.has(k)) problems.push(`returned ${k}, which must never be returned`);
  if (e.count !== undefined && records.length !== e.count) problems.push(`expected ${e.count} result(s), got ${records.length}`);
  for (const [k, status] of Object.entries(e.reviewStatus ?? {})) {
    const got = records.filter((r) => keyOf(r) === k).map((r) => r.trust?.reviewStatus);
    if (got.length === 0 || got.some((x) => x !== status)) problems.push(`${k}: expected reviewStatus ${status}, got [${got}]`);
  }
  for (const [k, contested] of Object.entries(e.contested ?? {})) {
    const got = records.filter((r) => keyOf(r) === k).map((r) => r.trust?.contested === true);
    if (got.length === 0 || got.some((x) => x !== contested)) problems.push(`${k}: expected contested ${contested}, got [${got}]`);
  }
  for (const [k, locale] of Object.entries(e.locales ?? {})) {
    const got = records.filter((r) => keyOf(r) === k).map((r) => r.node.locale);
    if (got.length === 0 || got.some((l) => l !== locale)) problems.push(`${k}: expected locale ${locale}, got [${got}]`);
  }
  for (const r of records) {
    const errors = validateAgainst('citationRecord', r);
    if (errors.length > 0) problems.push(`${keyOf(r)} is not a valid citation record: ${errors[0]}`);
    if (typeof r.score !== 'number') problems.push(`${keyOf(r)} has no score`);
  }
  return problems;
}

function checkStructure(e, actual) {
  const problems = [];
  if (!same(e.codes ?? [], actual.codes ?? [])) problems.push(`codes: expected [${uniqueSorted(e.codes ?? [])}], got [${uniqueSorted(actual.codes ?? [])}]`);
  if (JSON.stringify(e.result) !== JSON.stringify(actual.result)) problems.push(`result: expected ${JSON.stringify(e.result)}, got ${JSON.stringify(actual.result)}`);
  return problems;
}

let failures = 0;
let skipped = 0;
for (const c of corpus.cases) {
  if ((c.requires ?? []).some((f) => without.has(f))) {
    skipped++;
    continue;
  }
  const actual = await run(c);
  if (showActual) {
    const shown = c.kind === 'search' ? { codes: uniqueSorted(actual.codes ?? []), results: (actual.records ?? []).map(keyOf) }
      : c.kind === 'structure' ? actual
        : { ...actual, codes: uniqueSorted(actual.codes), capabilities: uniqueSorted(actual.capabilities) };
    console.log(`${c.id}: ${JSON.stringify(shown)}`);
    continue;
  }
  const problems = c.kind === 'search' ? checkSearch(c.expect, actual)
    : c.kind === 'structure' ? checkStructure(c.expect, actual)
      : checkPackage(c.expect, actual);
  if (problems.length > 0) {
    failures++;
    console.error(`FAIL ${c.id}\n  ${problems.join('\n  ')}`);
  }
}

if (!showActual) {
  if (failures > 0) {
    console.error(`\n${failures} of ${corpus.cases.length - skipped} case(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log(`All ${corpus.cases.length - skipped} conformance case(s) pass${skipped > 0 ? `; ${skipped} skipped (without ${[...without].join(', ')})` : ''}.`);
  }
}
