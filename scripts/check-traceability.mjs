// Checks conformance/README.md "Requirements and cases" against the corpus:
// every case it names exists, and every diagnostic code in the Reader contract
// is expected by a case or is listed there as untestable.
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const corpus = JSON.parse(read('conformance/cases.json'));
const cases = Array.isArray(corpus) ? corpus : corpus.cases;
const ids = cases.map((c) => c.id);
const readme = read('conformance/README.md');
const section = readme.slice(readme.indexOf('### Requirements and cases'), readme.indexOf('## Running it'));
const [covered, untestable] = section.split('**Not testable by the corpus.**');

const problems = [];
const caseCells = covered.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| ---') && !l.startsWith('| Requirement')).map((l) => l.split('|')[3] ?? '');
for (const [, name] of caseCells.join(' ').matchAll(/`([a-z0-9-]+\*?)`/g)) {
  const hit = name.endsWith('*') ? ids.some((id) => id.startsWith(name.slice(0, -1))) : ids.includes(name);
  if (!hit) problems.push(`README names case "${name}", which does not exist`);
}
const listed = new Set([...untestable.matchAll(/`([A-Z]\d{3}_[A-Z0-9_]+)`/g)].map((m) => m[1]));
const expected = new Set(cases.flatMap((c) => c.expect?.codes ?? []));
const codes = [...read('spec/moca-reader-contract.md').matchAll(/^\| `([A-Z]\d{3}_[A-Z0-9_]+)` \|/gm)].map((m) => m[1]);
for (const code of codes) {
  if (!expected.has(code) && !listed.has(code)) problems.push(`${code} has no case and is not listed as untestable`);
}
if (problems.length > 0) {
  for (const p of problems) console.error(p);
  process.exit(1);
}
console.log(`Traceability: ${codes.length} codes, each expected by a case or listed as untestable; every case the README names exists.`);
