import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, cpSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { signPackage } from '../lib/sign.js';
import { verifyPackageSignature } from '../lib/verify.js';
import { generateKeyPair, buildTrustRoot } from '../lib/keys.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

// Keys and trust roots MUST live outside the package directory being signed:
// canonicalDigest (core §5.5) hashes every file under the package root, so
// anything written alongside moca.json would itself become signed content.
async function withPackageAndWorkDir(fn) {
  const root = mkdtempSync(join(tmpdir(), 'moca-sign-test-'));
  const packageDir = join(root, 'package');
  const workDir = join(root, 'work');
  mkdirSync(workDir, { recursive: true });
  try {
    cpSync(join(fixturesDir, 'sample-package'), packageDir, { recursive: true });
    return await fn({ packageDir, workDir });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function writeTrustRoot(workDir, keyid, publicKeyPem) {
  const path = join(workDir, 'trust-root.json');
  writeFileSync(path, JSON.stringify({ keys: [{ keyid, publicKey: publicKeyPem, identity: 'test' }] }));
  return path;
}

test('dsse mode: sign then verify succeeds against the matching trust root', async () => {
  await withPackageAndWorkDir(async ({ packageDir, workDir }) => {
    const { privateKeyPem, publicKeyPem } = generateKeyPair();
    const keyPath = join(workDir, 'key.pem');
    writeFileSync(keyPath, privateKeyPem);

    await signPackage({ rootDir: packageDir, mode: 'dsse', privateKeyPath: keyPath, keyid: 'k1' });
    const trustRootPath = writeTrustRoot(workDir, 'k1', publicKeyPem);

    const result = await verifyPackageSignature({ rootDir: packageDir, dsseTrustRootPath: trustRootPath });
    assert.equal(result.outcome, 'valid');
    assert.equal(result.keyid, 'k1');
  });
});

test('dsse mode: verification detects tampering after signing', async () => {
  await withPackageAndWorkDir(async ({ packageDir, workDir }) => {
    const { privateKeyPem, publicKeyPem } = generateKeyPair();
    const keyPath = join(workDir, 'key.pem');
    writeFileSync(keyPath, privateKeyPem);
    await signPackage({ rootDir: packageDir, mode: 'dsse', privateKeyPath: keyPath, keyid: 'k1' });
    const trustRootPath = writeTrustRoot(workDir, 'k1', publicKeyPem);

    // Tamper with package content after signing.
    writeFileSync(join(packageDir, 'content', 'note.md'), '---\nid: note\n---\n# Tampered\n');

    const result = await verifyPackageSignature({ rootDir: packageDir, dsseTrustRootPath: trustRootPath });
    assert.equal(result.outcome, 'invalid');
  });
});

test('dsse mode: verification fails for a signer outside the trust root', async () => {
  await withPackageAndWorkDir(async ({ packageDir, workDir }) => {
    const { privateKeyPem } = generateKeyPair();
    const keyid = 'attacker-key';
    const keyPath = join(workDir, 'key.pem');
    writeFileSync(keyPath, privateKeyPem);
    await signPackage({ rootDir: packageDir, mode: 'dsse', privateKeyPath: keyPath, keyid });

    // Trust root only knows about a different, unrelated key.
    const { publicKeyPem: someoneElsesKey } = generateKeyPair();
    const trustRootPath = writeTrustRoot(workDir, 'someone-else', someoneElsesKey);

    const result = await verifyPackageSignature({ rootDir: packageDir, dsseTrustRootPath: trustRootPath });
    assert.equal(result.outcome, 'invalid');
  });
});

test('missing signature is reported as malformed, not silently skipped', async () => {
  await withPackageAndWorkDir(async ({ packageDir }) => {
    const result = await verifyPackageSignature({ rootDir: packageDir });
    assert.equal(result.outcome, 'malformed');
  });
});

test('placeholder signature is reported as malformed', async () => {
  await withPackageAndWorkDir(async ({ packageDir }) => {
    const manifestPath = join(packageDir, 'moca.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.canonicalDigest = { algorithm: 'sha256', value: 'a'.repeat(64) };
    manifest.signature = { type: 'dsse', value: 'PLACEHOLDER-NOT-A-REAL-SIGNATURE-DO-NOT-TRUST' };
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    const result = await verifyPackageSignature({ rootDir: packageDir });
    assert.equal(result.outcome, 'malformed');
  });
});

test('signature without canonicalDigest is malformed (spec/moca-trust-model.md §2)', async () => {
  await withPackageAndWorkDir(async ({ packageDir }) => {
    const manifestPath = join(packageDir, 'moca.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.signature = { type: 'dsse', value: Buffer.from('{}').toString('base64') };
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    const result = await verifyPackageSignature({ rootDir: packageDir });
    assert.equal(result.outcome, 'malformed');
  });
});

test('generate-key emits a trust root that verifies its own signatures', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'moca-sign-trustroot-'));
  const prefix = join(dir, 'demo');
  const { privateKeyPem, publicKeyPem } = generateKeyPair();
  writeFileSync(`${prefix}.pem`, privateKeyPem);

  const trustRoot = buildTrustRoot({ keyid: 'demo-key', publicKeyPem });
  const trustRootPath = `${prefix}.trust-root.json`;
  writeFileSync(trustRootPath, JSON.stringify(trustRoot, null, 2));

  // The emitted trust root must round-trip: a package signed with the
  // generated key verifies against it with no hand-editing. Without this,
  // a freshly signed package is unlintable (E406) until the author writes a
  // trust root by hand.
  const pkg = join(dir, 'pkg');
  mkdirSync(join(pkg, 'content'), { recursive: true });
  writeFileSync(
    join(pkg, 'moca.json'),
    JSON.stringify({ id: 'urn:moca:test:trustroot', version: '1.0.0', title: 'T' }, null, 2)
  );
  writeFileSync(join(pkg, 'content', 'note.md'), '# Note\n');

  await signPackage({ rootDir: pkg, mode: 'dsse', privateKeyPath: `${prefix}.pem`, keyid: 'demo-key' });

  const result = await verifyPackageSignature({ rootDir: pkg, dsseTrustRootPath: trustRootPath });
  assert.equal(result.outcome, 'valid');

  rmSync(dir, { recursive: true, force: true });
});
