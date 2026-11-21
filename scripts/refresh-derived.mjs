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
import { appendFileSync, cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import { createPrivateKey, sign as cryptoSign } from 'node:crypto';
import { readPackage, directoryResolver, packageStatement, issuedCopyStatement, rebuiltDigest, preAuthEncode, PAYLOAD_TYPE } from '@openmoca/moca-core';
import { signPackage, reviewNodes } from '@openmoca/moca-sign';
import { buildSidecar } from '@openmoca/moca-index';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');

async function refresh(root) {
  const config = JSON.parse(readFileSync(join(repo, 'scripts/derived.config.json'), 'utf8'));
  const at = (p) => join(root, p);
  const key = (name) => ({ privateKeyPem: readFileSync(join(repo, config.keys[name].file), 'utf8'), keyid: config.keys[name].keyid });

  // Attestations are regenerated from scratch for every package we sign.
  const owned = new Set([...config.sign, ...config.review, ...config.signNotEd25519].map((s) => s.package).concat(config.copyAttestations.map((c) => c.to)));
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
  // A correct signature from a key that is not Ed25519, which no Reader may accept (attestations §5).
  for (const s of config.signNotEd25519) {
    const r = await readPackage(at(s.package));
    const statement = Buffer.from(JSON.stringify(packageStatement({ id: r.manifest.id, version: r.manifest.version, digest: r.digest })), 'utf8');
    const { privateKeyPem, keyid } = key(s.key);
    const sig = cryptoSign('sha256', preAuthEncode(PAYLOAD_TYPE, statement), createPrivateKey(privateKeyPem));
    const envelope = { payload: statement.toString('base64'), payloadType: PAYLOAD_TYPE, signatures: [{ keyid, sig: sig.toString('base64') }] };
    mkdirSync(at(join(s.package, 'attestations')), { recursive: true });
    writeFileSync(at(join(s.package, 'attestations', `package.${keyid}.dsse.json`)), `${JSON.stringify(envelope, null, 2)}\n`);
  }
  for (const r of config.review) {
    await reviewNodes({ dir: at(r.package), nodes: r.nodes, reviewer: r.reviewer, outcome: r.outcome ?? 'accurate', reviewedAt: r.at, scope: r.scope, name: r.name, ...key(r.key) });
  }
  for (const c of config.copyAttestations) cpSync(at(join(c.from, 'attestations')), at(join(c.to, 'attestations')), { recursive: true });

  // Issued copies (attestations §3a): a copy of a signed original, marked, with issued-copy attestations.
  for (const c of config.issued) {
    rmSync(at(c.out), { recursive: true, force: true });
    cpSync(at(c.from), at(c.out), { recursive: true });
    for (const [path, text] of Object.entries(c.mark)) appendFileSync(at(join(c.out, path)), text);
    const original = await readPackage(at(c.from));
    const copy = await readPackage(at(c.out));
    for (const a of c.attestations) {
      const changed = new Map(a.empty ? [] : Object.keys(c.mark).map((p) => [p, original.fileDigests.get(p)]));
      for (const [p, hash] of Object.entries(a.changed ?? {})) changed.set(p, hash === 'CURRENT' ? copy.fileDigests.get(p) : hash);
      const originalDigest = a.rebuild ? rebuiltDigest(copy.fileDigests, changed) : (a.original ?? original.digest);
      const statement = Buffer.from(JSON.stringify(issuedCopyStatement({
        id: copy.manifest.id, version: copy.manifest.version, digest: copy.digest, originalDigest, changedFiles: Object.fromEntries(changed),
      })), 'utf8');
      const { privateKeyPem, keyid } = key(a.key);
      const sig = cryptoSign(null, preAuthEncode(PAYLOAD_TYPE, statement), createPrivateKey(privateKeyPem));
      const envelope = { payload: statement.toString('base64'), payloadType: PAYLOAD_TYPE, signatures: [{ keyid, sig: sig.toString('base64') }] };
      writeFileSync(at(join(c.out, 'attestations', `${a.name ?? `issued.${keyid}`}.dsse.json`)), `${JSON.stringify(envelope, null, 2)}\n`);
    }
  }

  for (const s of config.sidecars) {
    await buildSidecar({ pkg: at(s.package), out: at(s.out), chunker: s.chunk, force: true });
    for (const [name, kind] of Object.entries(s.variants ?? {})) writeVariant(at(s.out), at(join(dirname(s.out), name)), kind);
  }

  for (const a of config.archives) {
    const zip = new AdmZip();
    const r = await readPackage(at(a.package));
    // A fixed entry time keeps the archive byte-identical across refreshes.
    for (const e of r.source.list()) {
      // `rename` gives an entry a name a directory fixture cannot hold on every file system.
      const name = a.rename?.[e.path] ?? e.path;
      zip.addFile(name, r.source.read(e.path));
      zip.getEntry(name).header.time = new Date(1980, 0, 1);
    }
    // `add` copies an entry under another name, for paths that must collide.
    for (const [name, from] of Object.entries(a.add ?? {})) {
      zip.addFile(name, r.source.read(from));
      zip.getEntry(name).header.time = new Date(1980, 0, 1);
    }
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
  if (kind === 'dense' || kind === 'dense-json' || kind === 'vectors-length' || kind === 'dense-prefixed') {
    // Vectors from the conformance embedder, which maps every text to [1, 0].
    index.indexType = 'hybrid';
    index.model = { name: 'conformance-embedder', version: '1', dimensions: 2 };
    // Prefixes the producer's embedder declared: compared by Readers, never applied.
    if (kind === 'dense-prefixed') Object.assign(index.model, { queryPrefix: 'query: ', documentPrefix: 'passage: ' });
    const items = readFileSync(payloadPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    if (kind === 'dense-json') {
      // The deprecated form: a JSON vector on each item.
      writeFileSync(payloadPath, `${items.map((i) => JSON.stringify({ ...i, vector: [1, 0] })).join('\n')}\n`);
    } else {
      const rows = kind === 'vectors-length' ? items.length - 1 : items.length;
      const buf = Buffer.alloc(Math.max(rows, 0) * 2 * 4);
      for (let i = 0; i < rows; i++) buf.writeFloatLE(1, i * 8);
      writeFileSync(join(outDir, 'payload', 'vectors.f32'), buf);
      index.storage.vectors = { file: 'payload/vectors.f32', dtype: 'float32', dimensions: 2 };
    }
  }
  if (kind.startsWith('distance-')) {
    // Vectors chosen so that each distance puts a different node first for the
    // conformance embedder's query vector [1, 0].
    const distance = kind.slice('distance-'.length);
    const rows = distance === 'euclidean' ? { 'a.md': [10, 0], 'b.md': [0.9, 0.1] } : { 'a.md': [1, 0], 'b.md': [3, 3] };
    const items = readFileSync(payloadPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    const buf = Buffer.alloc(items.length * 2 * 4);
    items.forEach((item, i) => rows[item.path].forEach((x, d) => buf.writeFloatLE(x, (i * 2 + d) * 4)));
    writeFileSync(join(outDir, 'payload', 'vectors.f32'), buf);
    index.indexType = 'hybrid';
    // Cosine is the default: that variant leaves distance out.
    index.model = { name: 'conformance-embedder', version: '1', dimensions: 2, ...(distance === 'cosine' ? {} : { distance }) };
    index.storage.vectors = { file: 'payload/vectors.f32', dtype: 'float32', dimensions: 2 };
  }
  if (kind === 'no-text') {
    // Valid: text is optional, and a Reader searches the package text the offsets point at.
    const items = readFileSync(payloadPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    writeFileSync(payloadPath, `${items.map(({ text, ...i }) => JSON.stringify(i)).join('\n')}\n`);
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
