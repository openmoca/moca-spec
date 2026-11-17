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

/** A JSON value with object members sorted, so member order is never compared (arrays keep their order). */
function canonical(v) {
  if (Array.isArray(v)) return v.map(canonical);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical(v[k])]));
  return v;
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
  // Package spec §4.1: null means the result has no distribution (an invalid manifest).
  if (e.distribution !== undefined && e.distribution !== (actual.distribution ?? null)) {
    problems.push(`distribution: expected ${e.distribution}, got ${actual.distribution ?? null}`);
  }
  // Package spec §4.6–4.12, attestations §7.1: result fields compared as JSON values; null means absent.
  for (const field of ['images', 'translations', 'tags', 'apps', 'readingOrder', 'issuedCopy', 'datePublished']) {
    if (e[field] === undefined) continue;
    const got = actual[field] ?? null;
    if (JSON.stringify(canonical(got)) !== JSON.stringify(canonical(e[field]))) problems.push(`${field}: expected ${JSON.stringify(e[field])}, got ${JSON.stringify(got)}`);
  }
  // Contract §15.1: the terms result. `authority` is compared exactly, `problems` as a set of "code path", and
  // `declared` as a JSON value; each only when the case gives it. null means the result has no terms.
  if (e.terms === null && actual.terms != null) problems.push(`terms: expected none, got ${JSON.stringify(actual.terms)}`);
  if (e.terms) {
    const got = actual.terms ?? {};
    if (e.terms.authority !== undefined && e.terms.authority !== got.authority) problems.push(`terms.authority: expected ${e.terms.authority}, got ${got.authority}`);
    if (e.terms.problems !== undefined) {
      const key = (p) => `${p.code} ${p.path}`;
      if (!same(e.terms.problems.map(key), (got.problems ?? []).map(key))) problems.push(`terms.problems: expected [${e.terms.problems.map(key)}], got [${(got.problems ?? []).map(key)}]`);
    }
    if (e.terms.declared !== undefined && JSON.stringify(canonical(e.terms.declared)) !== JSON.stringify(canonical(got.declared ?? null))) problems.push(`terms.declared: expected ${JSON.stringify(e.terms.declared)}, got ${JSON.stringify(got.declared ?? null)}`);
  }
  // Encrypted packages §5.3: the fields of envelope the case gives are compared exactly.
  for (const [field, want] of Object.entries(e.envelope ?? {})) {
    const got = actual.envelope?.[field];
    if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`envelope.${field}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
  }
  if (e.envelope === undefined && actual.envelope !== undefined && actual.envelope !== null) problems.push('envelope: expected none, got one');
  if (e.sidecarUsable !== undefined && e.sidecarUsable !== actual.sidecarUsable) {
    problems.push(`sidecarUsable: expected ${e.sidecarUsable}, got ${actual.sidecarUsable}`);
  }
  for (const [path, want] of Object.entries(e.evidenceMatched ?? {})) {
    const got = actual.evidenceMatched?.[path];
    if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`evidenceMatched ${path}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
  }
  // Contract §7: where a refined quote is spoken; null means absent.
  for (const [path, want] of Object.entries(e.evidenceLocated ?? {})) {
    const got = actual.evidenceLocated?.[path];
    if (JSON.stringify(canonical(got)) !== JSON.stringify(canonical(want))) problems.push(`evidenceLocated ${path}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
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
  // Attestations §7.1: the issued-copy fields of each listed result.
  for (const [k, want] of Object.entries(e.issuedChange ?? {})) {
    const got = records.filter((r) => keyOf(r) === k).map((r) => r.node.issuedChange === true);
    if (got.length === 0 || got.some((x) => x !== want)) problems.push(`${k}: expected issuedChange ${want}, got [${got}]`);
  }
  for (const [k, want] of Object.entries(e.fileChanged ?? {})) {
    const got = records.filter((r) => keyOf(r) === k).map((r) => (r.trust.attestedReviews ?? []).some((x) => x.fileChanged === true));
    if (got.length === 0 || got.some((x) => x !== want)) problems.push(`${k}: expected a fileChanged review ${want}, got [${got}]`);
  }
  // Record fields by node ref: each listed field (a dotted path such as node.media) compared as a JSON value; null
  // means absent. Package spec §4.12 and §5.7.
  for (const [k, fields] of Object.entries(e.fields ?? {})) {
    const got = records.filter((r) => keyOf(r) === k);
    if (got.length === 0) problems.push(`${k}: expected a result to compare fields with`);
    for (const r of got) {
      for (const [path, want] of Object.entries(fields)) {
        const value = path.split('.').reduce((v, p) => (v && typeof v === 'object' ? v[p] : undefined), r) ?? null;
        if (JSON.stringify(canonical(value)) !== JSON.stringify(canonical(want))) problems.push(`${k}: expected ${path} ${JSON.stringify(want)}, got ${JSON.stringify(value)}`);
      }
    }
  }
  if (e.issuedCopy !== undefined) {
    for (const r of records) {
      if (JSON.stringify(r.package.issuedCopy ?? null) !== JSON.stringify(e.issuedCopy)) problems.push(`${keyOf(r)}: expected package.issuedCopy ${JSON.stringify(e.issuedCopy)}, got ${JSON.stringify(r.package.issuedCopy ?? null)}`);
    }
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
      : c.kind === 'structure' || c.kind === 'map-time' ? actual
        : { ...actual, codes: uniqueSorted(actual.codes), capabilities: uniqueSorted(actual.capabilities) };
    console.log(`${c.id}: ${JSON.stringify(shown)}`);
    continue;
  }
  const problems = c.kind === 'search' ? checkSearch(c.expect, actual)
    : c.kind === 'structure' || c.kind === 'map-time' ? checkStructure(c.expect, actual)
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
