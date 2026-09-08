// Lints every example package in the repository and compares the result to a
// recorded baseline of expected warnings.
//
// Replaces a hardcoded list of package paths in package.json, which silently
// stopped covering any example added after it was written. Packages are
// discovered by looking for moca.json.
//
// The baseline exists because several example packages warn *by design* --
// level-3-extended deliberately references a media file it does not ship, to
// demonstrate an evidence locator pointing outside the package; the semantic
// examples use `ex:` CURIEs that resolve to no in-package ontology. Recording
// them means CI fails on a NEW warning instead of drowning it in known noise.
//
//   node scripts/lint-examples.mjs             # lint, compare to baseline
//   node scripts/lint-examples.mjs --update    # rewrite the baseline
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { findPackages } from './lib/find-packages.mjs';
import { lintPackage } from 'moca-lint/lib/lint.js';
import { formatSarif } from 'moca-lint/lib/format.js';

const root = process.cwd();
const update = process.argv.includes('--update');
const sarifIndex = process.argv.indexOf('--sarif');
const sarifPath = sarifIndex === -1 ? null : process.argv[sarifIndex + 1];
const BASELINE = join(root, 'scripts/example-lint-baseline.json');
const TRUST_ROOT = join(root, 'fixtures/signing-keys/example-signing-trust-root.json');

const packageRoots = ['examples', 'profiles']
  .flatMap((searchRoot) => findPackages(join(root, searchRoot)))
  .sort();

let errorCount = 0;
const observed = {};
const allFindings = [];

for (const packageRoot of packageRoots) {
  const key = relative(root, packageRoot).split('\\').join('/');
  const { findings } = await lintPackage({ rootDir: packageRoot, trustRoot: TRUST_ROOT });
  allFindings.push(...findings.map((f) => ({ ...f, file: f.file ? `${key}/${f.file}` : key })));

  const errors = findings.filter((f) => f.severity === 'error');
  if (errors.length) {
    errorCount += errors.length;
    for (const finding of errors) {
      console.error(`[ERROR] ${key}: ${finding.code} ${finding.message ?? ''}`);
    }
  }

  const nonErrors = findings
    .filter((f) => f.severity !== 'error')
    .map((f) => f.code)
    .sort();
  if (nonErrors.length) observed[key] = nonErrors;
}

if (sarifPath) {
  writeFileSync(sarifPath, formatSarif(allFindings), 'utf8');
  console.log(`SARIF report written to ${sarifPath}.`);
}

console.log(`Linted ${packageRoots.length} example package(s).`);

if (errorCount > 0) {
  console.error(`\n${errorCount} error-severity finding(s). Example packages must lint clean.`);
  process.exit(1);
}

if (update) {
  writeFileSync(BASELINE, `${JSON.stringify(observed, null, 2)}\n`, 'utf8');
  console.log(`Baseline written to ${relative(root, BASELINE)}.`);
  process.exit(0);
}

const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : {};
const drift = [];
for (const key of new Set([...Object.keys(baseline), ...Object.keys(observed)])) {
  const before = (baseline[key] ?? []).join(',');
  const after = (observed[key] ?? []).join(',');
  if (before !== after) drift.push(`  ${key}\n    baseline: [${before}]\n    observed: [${after}]`);
}

if (drift.length) {
  console.error(`\nExample lint findings drifted from the recorded baseline:\n${drift.join('\n')}`);
  console.error('\nIf the change is intended, re-record it: node scripts/lint-examples.mjs --update');
  process.exit(1);
}

const known = Object.values(observed).reduce((n, codes) => n + codes.length, 0);
console.log(`0 error(s); ${known} known non-error finding(s) matching the baseline.`);
