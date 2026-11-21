#!/usr/bin/env node
// Builds the conformance fixtures that are awkward to write by hand: archives whose directory records are unusual,
// DSSE envelopes with many signature entries, a structure file whose collections share one member list, terms with
// malformed containers, and trust roots derived from the corpus's own. Everything is deterministic: run it again
// and the files do not change. The keys are the corpus's INSECURE test keys.
//
//   node scripts/limit-fixtures.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32, deflateRawSync } from 'node:zlib';
import { createEnvelope, packageStatement, readPackage } from '@openmoca/moca-core';

const root = fileURLToPath(new URL('../', import.meta.url));
const fixtures = join(root, 'conformance', 'fixtures');
const write = (path, content) => {
  const full = join(fixtures, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
};
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const readJson = (path) => JSON.parse(readFileSync(join(fixtures, path), 'utf8'));

// --- Archives (Reader contract §3, "Directory") ---

const MANIFEST = json({ id: 'https://example.com/conformance/minimal', version: '1.0.0', title: 'Fixture' });
const NODE = '---\ntype: Article\ntitle: Hello\n---\n\n# Hello\n\nHello.\n';

/**
 * A Zip archive, written field by field so a fixture can make one record disagree with another.
 * Each entry: { name, data, localName?, declaredSize?, deflate? }.
 */
function zip(entries, { comment = Buffer.alloc(0) } = {}) {
  const locals = [];
  const central = [];
  let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name, 'utf8');
    const localName = Buffer.from(e.localName ?? e.name, 'utf8');
    const data = Buffer.from(e.data, 'utf8');
    const stored = e.deflate ? deflateRawSync(data) : data;
    const size = e.declaredSize ?? data.length;
    const header = (signature, extra) => {
      const b = Buffer.alloc(extra);
      b.writeUInt32LE(signature, 0);
      return b;
    };
    const local = header(0x04034b50, 30);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // flags: UTF-8 names
    local.writeUInt16LE(e.deflate ? 8 : 0, 8);
    local.writeUInt32LE(0x5b210000, 10); // a fixed time and date
    local.writeUInt32LE(crc32(data), 14);
    local.writeUInt32LE(stored.length, 18);
    local.writeUInt32LE(size, 22);
    local.writeUInt16LE(localName.length, 26);
    locals.push(local, localName, stored);
    const dir = header(0x02014b50, 46);
    dir.writeUInt16LE(0x0314, 4); // made by: Unix
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(0x0800, 8);
    dir.writeUInt16LE(e.deflate ? 8 : 0, 10);
    dir.writeUInt32LE(0x5b210000, 12);
    dir.writeUInt32LE(crc32(data), 16);
    dir.writeUInt32LE(stored.length, 20);
    dir.writeUInt32LE(size, 24);
    dir.writeUInt16LE(name.length, 28);
    dir.writeUInt32LE(0o100644 * 0x10000, 38); // a regular file
    dir.writeUInt32LE(offset, 42);
    central.push(dir, name);
    offset += local.length + localName.length + stored.length;
  }
  const directory = Buffer.concat(central);
  return Buffer.concat([...locals, directory, endRecord(entries.length, directory.length, offset, comment)]);
}

function endRecord(count, size, offset, comment = Buffer.alloc(0)) {
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(count, 8);
  end.writeUInt16LE(count, 10);
  end.writeUInt32LE(size, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(comment.length, 20);
  return Buffer.concat([end, comment]);
}

const plain = [{ name: 'content/hello.md', data: NODE }, { name: 'moca.json', data: MANIFEST }];
const sizeOf = (entries) => entries.reduce((n, e) => n + 30 + Buffer.byteLength(e.name) + Buffer.byteLength(e.data), 0);
const directorySize = (entries) => entries.reduce((n, e) => n + 46 + Buffer.byteLength(e.name), 0);

// The archive comment is itself a complete end record for the same directory, so two records end at the end of
// the file.
write('archive-two-end-records.zip', zip(plain, { comment: endRecord(plain.length, directorySize(plain), sizeOf(plain)) }));
// A Zip64 end record and its locator sit before the end record.
{
  const body = zip(plain);
  const at = body.length - 22;
  const zip64 = Buffer.alloc(56 + 20);
  zip64.writeUInt32LE(0x06064b50, 0);
  zip64.writeBigUInt64LE(44n, 4);
  zip64.writeUInt16LE(45, 12);
  zip64.writeUInt16LE(45, 14);
  zip64.writeBigUInt64LE(BigInt(plain.length), 24);
  zip64.writeBigUInt64LE(BigInt(plain.length), 32);
  zip64.writeBigUInt64LE(BigInt(directorySize(plain)), 40);
  zip64.writeBigUInt64LE(BigInt(sizeOf(plain)), 48);
  zip64.writeUInt32LE(0x07064b50, 56);
  zip64.writeBigUInt64LE(BigInt(at), 64);
  zip64.writeUInt32LE(1, 72);
  write('archive-zip64.zip', Buffer.concat([body.subarray(0, at), zip64, body.subarray(at)]));
}
// One entry's local header names another file than the central directory does.
write('archive-local-name-mismatch.zip', zip([{ name: 'content/hello.md', localName: 'content/other.md', data: NODE }, plain[1]]));
// One deflated entry declares more bytes than it holds.
write('archive-entry-short.zip', zip([{ name: 'content/hello.md', data: NODE, deflate: true, declaredSize: Buffer.byteLength(NODE) + 10 }, plain[1]]));

// --- Signatures in one envelope (attestations §7, step 7) ---

const publisherKey = readFileSync(join(root, 'fixtures', 'signing-keys', 'INSECURE-publisher.pem'), 'utf8');
const KEYID = 'example-publisher-2026';

async function manySignatures(dir, id, others) {
  write(`${dir}/moca.json`, json({ id, version: '1.0.0', title: 'Fixture' }));
  write(`${dir}/content/hello.md`, NODE);
  const result = await readPackage(join(fixtures, dir));
  const statement = packageStatement({ id, version: '1.0.0', digest: result.digest });
  const envelope = createEnvelope({ payload: Buffer.from(JSON.stringify(statement)), payloadType: 'application/vnd.in-toto+json', privateKeyPem: publisherKey, keyid: KEYID });
  // Entries no trusted key matches come first; the publisher's own is last.
  const unknown = Array.from({ length: others }, (_, i) => ({ keyid: `not-in-the-trust-root-${i + 1}`, sig: Buffer.alloc(64).toString('base64') }));
  envelope.signatures = [...unknown, ...envelope.signatures];
  write(`${dir}/attestations/package.${KEYID}.dsse.json`, json(envelope));
}
await manySignatures('attestation-signatures-at-limit', 'https://example.com/conformance/signatures-at-limit', 15);
await manySignatures('attestation-signatures-over-limit', 'https://example.com/conformance/signatures-over-limit', 16);

// --- Collections that share one member list (Reader contract §3) ---

{
  const dir = 'structure-shared-list';
  const names = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'];
  const paths = ['A', 'B', 'C', 'D', 'E', 'F'];
  const ttl = [
    '@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .',
    '@prefix skos: <http://www.w3.org/2004/02/skos/core#> .',
    '@prefix c: <https://example.org/conformance/shared#> .',
    '',
    ...names.map((n) => `c:${n} a skos:Concept .`),
    '',
    '# Six collections name one list: 30 triples, 36 members.',
    ...paths.map((p) => `c:Path${p} a skos:OrderedCollection ; skos:memberList _:l1 .`),
    '',
    ...names.map((n, i) => `_:l${i + 1} rdf:first c:${n} ; rdf:rest ${i + 1 < names.length ? `_:l${i + 2}` : 'rdf:nil'} .`),
    '',
  ].join('\n');
  write(`${dir}/moca.json`, json({ id: 'https://example.com/conformance/structure-shared-list', version: '1.0.0', title: 'Fixture' }));
  write(`${dir}/content/hello.md`, NODE);
  write(`${dir}/structure.ttl`, ttl);
}

// --- Terms with malformed containers, and ratings (package spec §4.14, Reader contract §15) ---

const episode = (n) => `---\ntype: Episode\ntitle: Episode ${n}\nmoca:\n  audience: public\n---\n\n# Episode ${n}\n\nIn episode ${n} the lantern keeper talks about the harbour lantern.\n`;
function termsFixture(name, terms) {
  write(`terms/${name}/moca.json`, json({ id: `https://example.com/conformance/terms-${name}`, version: '1.0.0', title: 'Terms fixture', language: 'en', terms }));
  write(`terms/${name}/content/a.md`, episode(1));
  write(`terms/${name}/content/b.md`, episode(2));
}
termsFixture('allowed-not-object', { ai: { allowed: false } });
termsFixture('ai-not-object', { ai: 'none' });
termsFixture('nodes-not-array', { nodes: { paths: ['content/a.md'] } });
termsFixture('node-entry-not-object', { nodes: ['content/a.md'] });
termsFixture('node-paths-malformed', { nodes: [{ paths: 'content/a.md', ai: { allowed: { provider: false } } }] });
termsFixture('node-allowed-not-object', { nodes: [{ paths: ['content/a.md'], ai: { allowed: false } }] });
termsFixture('rating-other-scheme', { rating: { contentRating: [{ scheme: 'other-scheme', value: '18' }] } });
termsFixture('rating-not-object', { rating: 'clean' });
termsFixture('rating-explicit-malformed', { rating: { explicit: 'no' } });

// --- Manifests of the wrong shape (Reader contract §5) ---

write('manifest-not-object/moca.json', 'null\n');
write('manifest-not-object/content/hello.md', NODE);
write('manifest-locales-wrong-type/moca.json', json({ id: 'https://example.com/conformance/locales-wrong-type', version: '1.0.0', title: 'Fixture', locales: 5 }));
write('manifest-locales-wrong-type/content/hello.md', NODE);

// --- Trust roots (attestations §6) ---

{
  const base = readJson('trust-root.json');
  const withIds = (ids) => ({ ...base, keys: base.keys.map((k) => (k.keyid === KEYID ? (ids ? { ...k, ids } : (({ ids: _ids, ...rest }) => rest)(k)) : k)) });
  write('trust-root-signer-exact-id.json', json(withIds(['https://example.com/conformance/signed'])));
  write('trust-root-signer-no-ids.json', json(withIds(null)));
}
{
  const base = readJson('sigstore/trust-root.json');
  const publisher = (change) => ({ ...base, sigstore: { ...base.sigstore, identities: base.sigstore.identities.map((i) => (i.roles.includes('package') ? change(i) : i)) } });
  // The subject without its last character, and with one character replaced by a full stop: neither is the
  // certificate's subject.
  write('sigstore/trust-root-subject-shorter.json', json(publisher((i) => ({ ...i, subject: i.subject.slice(0, -1) }))));
  write('sigstore/trust-root-subject-other-character.json', json(publisher((i) => ({ ...i, subject: i.subject.replace('@refs/heads', '@refs.heads') }))));
  write('sigstore/trust-root-issuer-shorter.json', json(publisher((i) => ({ ...i, issuer: i.issuer.slice(0, -1) }))));
  write('sigstore/trust-root-other-ids.json', json(publisher((i) => ({ ...i, ids: ['https://example.com/other/'] }))));
}

// --- Nesting (Reader contract §3): 64 levels are read, 65 are not ---

{
  const arrays = (n) => `${'['.repeat(n)}${']'.repeat(n)}`;
  // The manifest object is level 1, so a member's value may hold 63 more.
  const manifest = (name, depth) => `{\n  "id": "https://example.com/conformance/${name}",\n  "version": "1.0.0",\n  "title": "Fixture",\n  "x-example-nested": ${arrays(depth)}\n}\n`;
  for (const [name, depth] of [['manifest-nesting-at-limit', 63], ['manifest-nesting-over-limit', 64]]) {
    write(`${name}/moca.json`, manifest(name, depth));
    write(`${name}/content/hello.md`, NODE);
  }
  // The frontmatter mapping is level 1 too.
  for (const [name, depth] of [['frontmatter-nesting-at-limit', 63], ['frontmatter-nesting-over-limit', 64]]) {
    write(`${name}/moca.json`, json({ id: `https://example.com/conformance/${name}`, version: '1.0.0', title: 'Fixture' }));
    write(`${name}/content/hello.md`, NODE);
    write(`${name}/content/nested.md`, `---\ntype: Article\ntitle: Nested\nx-example-nested: ${arrays(depth)}\n---\n\n# Nested\n\nNested.\n`);
  }
  // A structure file nested past the limit on the line of a prefixed name that holds an escaped '#', which is part of
  // the name, not a comment.
  {
    const name = 'structure-nesting-over-limit';
    const depth = 257;
    write(`${name}/moca.json`, json({ id: `https://example.com/conformance/${name}`, version: '1.0.0', title: 'Fixture' }));
    write(`${name}/content/hello.md`, NODE);
    write(`${name}/structure.ttl`, '@prefix e: <https://example.org/conformance#> .\n\n'
      + `# ${depth} levels of blank nodes, on the line of a name that holds an escaped "#".\n`
      + `e:boundary\\#1 e:part ${'[ e:part '.repeat(depth)}1${' ]'.repeat(depth)} .\n`);
  }
  // A signed envelope with one more member, nested past the limit.
  const dir = 'attestation-nesting-over-limit';
  const id = `https://example.com/conformance/${dir}`;
  write(`${dir}/moca.json`, json({ id, version: '1.0.0', title: 'Fixture' }));
  write(`${dir}/content/hello.md`, NODE);
  const result = await readPackage(join(fixtures, dir));
  const statement = packageStatement({ id, version: '1.0.0', digest: result.digest });
  const envelope = createEnvelope({ payload: Buffer.from(JSON.stringify(statement)), payloadType: 'application/vnd.in-toto+json', privateKeyPem: publisherKey, keyid: KEYID });
  write(`${dir}/attestations/package.${KEYID}.dsse.json`, `${JSON.stringify(envelope, null, 2).replace(/\n\}$/, `,\n  "x-example-nested": ${arrays(64)}\n}`)}\n`);
}
