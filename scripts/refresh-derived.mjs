#!/usr/bin/env node
// Regenerates every derived artifact listed in scripts/derived.config.json:
// member digest pins, publisher and review attestations, sidecar indexes and
// archive fixtures, then the literal digests in conformance/cases.json.
//
//   node scripts/refresh-derived.mjs          rewrite in place
//   node scripts/refresh-derived.mjs --check  fail if anything is out of date
//
// --check runs the same refresh on a temporary copy and compares the result
// with the working tree, so there is only one code path to trust.
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import { readPackage, directoryResolver } from '@openmoca/moca-core';
import { signPackage, reviewNodes } from '@openmoca/moca-sign';
import { buildSidecar } from '@openmoca/moca-index';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');

async function refresh(root) {
  const config = JSON.parse(readFileSync(join(repo, 'scripts/derived.config.json'), 'utf8'));
  const at = (p) => join(root, p);
  const key = (name) => ({ privateKeyPem: readFileSync(join(repo, config.keys[name].file), 'utf8'), keyid: config.keys[name].keyid });

  // Attestations are regenerated from scratch for every package we sign.
  const owned = new Set([...config.sign, ...config.review].map((s) => s.package).concat(config.copyAttestations.map((c) => c.to)));
  for (const p of owned) rmSync(at(join(p, 'attestations')), { recursive: true, force: true });

  for (const { package: pkg, search } of config.pins) {
    const path = at(join(pkg, 'moca.json'));
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    const resolve = directoryResolver(search.map(at));
    for (const member of manifest.members) {
      const target = resolve(member);
      if (!target) throw new Error(`${pkg}: cannot resolve member ${member.id}@${member.version}`);
      const r = await readPackage(target);
      if (!r.digest) throw new Error(`${pkg}: member ${member.id} has no digest`);
      member.digest = r.digest;
    }
    writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  for (const s of config.sign) await signPackage({ dir: at(s.package), ...key(s.key) });
  for (const r of config.review) {
    await reviewNodes({ dir: at(r.package), nodes: r.nodes, reviewer: r.reviewer, outcome: r.outcome ?? 'accurate', reviewedAt: r.at, scope: r.scope, name: r.name, ...key(r.key) });
  }
  for (const c of config.copyAttestations) cpSync(at(join(c.from, 'attestations')), at(join(c.to, 'attestations')), { recursive: true });

  for (const s of config.sidecars) {
    await buildSidecar({ pkg: at(s.package), out: at(s.out), chunker: s.chunk, force: true });
    for (const [name, kind] of Object.entries(s.variants ?? {})) writeVariant(at(s.out), at(join(dirname(s.out), name)), kind);
  }

  for (const a of config.archives) {
    const zip = new AdmZip();
    const r = await readPackage(at(a.package));
    for (const e of r.source.list()) zip.addFile(e.path, r.source.read(e.path));
    zip.writeZip(at(a.out));
  }

  const casesPath = at('conformance/cases.json');
  const corpus = JSON.parse(readFileSync(casesPath, 'utf8'));
  for (const c of corpus.cases) {
    if (!c.expect.digest || c.expect.digest.startsWith('SAME:')) continue;
    const r = await readPackage(at(join('conformance', c.target)));
    c.expect.digest = r.digest;
  }
  writeFileSync(casesPath, `${JSON.stringify(corpus, null, 2)}\n`);
}

// Deliberately broken copies of a valid sidecar, one fault each.
function writeVariant(validDir, outDir, kind) {
  rmSync(outDir, { recursive: true, force: true });
  cpSync(validDir, outDir, { recursive: true });
  const indexPath = join(outDir, 'index.json');
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  const payloadPath = join(outDir, index.storage.file);
  if (kind === 'digest') index.target.digest = `sha256:${'0'.repeat(64)}`;
  if (kind === 'format') index.storage.format = 'lance';
  if (kind === 'target') index.target.id = 'https://example.com/conformance/another-package';
  if (kind === 'schema') index.indexType = 'dense';
  if (kind === 'dense') {
    // Vectors from the conformance embedder, which maps every text to [1, 0].
    index.indexType = 'hybrid';
    index.model = { name: 'conformance-embedder', version: '1', dimensions: 2 };
    const items = readFileSync(payloadPath, 'utf8').trim().split('\n').map((l) => ({ ...JSON.parse(l), vector: [1, 0] }));
    writeFileSync(payloadPath, `${items.map((i) => JSON.stringify(i)).join('\n')}\n`);
  }
  if (kind === 'item') {
    const items = readFileSync(payloadPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    items[0].chunkIndex = items[0].chunkCount;
    writeFileSync(payloadPath, `${items.map((i) => JSON.stringify(i)).join('\n')}\n`);
  }
  writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
}

function listFiles(dir, base = dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? listFiles(p, base) : [relative(base, p)];
  });
}

if (!check) {
  await refresh(repo);
  console.log('Derived artifacts refreshed.');
} else {
  const scratch = mkdtempSync(join(tmpdir(), 'moca-derived-'));
  try {
    for (const d of ['examples', 'conformance']) cpSync(join(repo, d), join(scratch, d), { recursive: true });
    mkdirSync(join(scratch, 'scripts'), { recursive: true });
    await refresh(scratch);
    const drift = [];
    for (const d of ['examples', 'conformance']) {
      const files = new Set([...listFiles(join(repo, d)), ...listFiles(join(scratch, d))]);
      for (const f of files) {
        const a = join(repo, d, f);
        const b = join(scratch, d, f);
        if (!existsSync(a) || !existsSync(b)) {
          drift.push(`${d}/${f} (${existsSync(a) ? 'should not exist' : 'missing'})`);
          continue;
        }
        if (f.endsWith('.zip')) {
          const [ra, rb] = await Promise.all([readPackage(a), readPackage(b)]);
          if (ra.digest !== rb.digest) drift.push(`${d}/${f}`);
        } else if (!readFileSync(a).equals(readFileSync(b))) {
          drift.push(`${d}/${f}`);
        }
      }
    }
    if (drift.length > 0) {
      console.error(`Derived artifacts are out of date; run npm run refresh:derived.\n  ${drift.join('\n  ')}`);
      process.exitCode = 1;
    } else {
      console.log('Derived artifacts are up to date.');
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}
