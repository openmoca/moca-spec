// The canonical package digest, spec/moca-package-spec.md §6.
//
// The digest identifies a package's content independently of how it is
// stored or transported: the same package as a directory, a .moca archive or
// a host source has the same digest. It is computed, never declared inside
// the package: a digest a package states about itself proves nothing, so it
// is only ever compared with a reference held elsewhere (an attestation, a
// member pin, a sidecar binding).
import { createHash } from 'node:crypto';
import canonicalize from 'canonicalize';

export const DIGEST_ALGORITHM = 'moca-digest-v1';
export const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/;
export const MANIFEST = 'moca.json';
export const ATTESTATIONS_DIR = 'attestations';

export function sha256Hex(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

/** RFC 8785 canonical JSON, as UTF-8 bytes. */
export function canonicalBytes(value) {
  const text = canonicalize(value);
  if (text === undefined) throw new Error('value cannot be canonicalised');
  return Buffer.from(text, 'utf8');
}

/** True when a path belongs to the attestations area, which the digest excludes. */
export function isAttestationPath(path) {
  return path === ATTESTATIONS_DIR || path.startsWith(`${ATTESTATIONS_DIR}/`);
}

/**
 * Checks every entry of a source and returns the regular files that make up
 * the package, keyed by their NFC-normalised path. Records P001-P003 and
 * returns ok=false if any entry makes the package's identity ambiguous.
 *
 * @param {import('./source.js').PackageSource} source
 * @param {import('./diagnostics.js').Diagnostics} diagnostics
 * @returns {{ ok: boolean, files: Map<string, string> }} NFC path -> stored path
 */
export function packageFiles(source, diagnostics) {
  const files = new Map();
  const folded = new Map();
  let ok = true;
  for (const entry of source.list()) {
    if (entry.kind === 'symlink' || entry.kind === 'other') {
      diagnostics.add('P001_UNSUPPORTED_ENTRY', `"${entry.path}" is a ${entry.kind === 'symlink' ? 'symbolic link' : 'non-regular file'}; packages may contain regular files only`, { file: entry.path });
      ok = false;
      continue;
    }
    if (entry.kind === 'unreadable') {
      diagnostics.add('P002_UNREADABLE_ENTRY', `"${entry.path}" could not be read`, { file: entry.path });
      ok = false;
      continue;
    }
    const nfc = entry.path.normalize('NFC');
    const key = nfc.toLowerCase();
    if (folded.has(key)) {
      diagnostics.add('P003_PATH_COLLISION', `"${entry.path}" collides with "${folded.get(key)}" after NFC normalisation or case folding`, { file: entry.path });
      ok = false;
      continue;
    }
    folded.set(key, entry.path);
    files.set(nfc, entry.path);
  }
  return { ok, files };
}

/**
 * Computes the canonical digest.
 *
 * @param {import('./source.js').PackageSource} source
 * @param {object} manifest  parsed moca.json
 * @param {Map<string, string>} files  NFC path -> stored path, from packageFiles()
 * @param {(path: string) => Buffer} [read]  defaults to source.read
 * @returns {{ digest: string, fileDigests: Map<string, string> }}  fileDigests: NFC path -> hex
 */
export function computeDigest(source, manifest, files, read = (p) => source.read(p)) {
  const fileDigests = new Map();
  const entries = {};
  for (const [nfc, stored] of [...files.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    if (nfc === MANIFEST || isAttestationPath(nfc)) continue;
    const hex = sha256Hex(read(stored));
    fileDigests.set(nfc, hex);
    entries[nfc] = hex;
  }
  const input = {
    algorithm: DIGEST_ALGORITHM,
    manifest: sha256Hex(canonicalBytes(manifest)),
    files: entries,
  };
  return { digest: `sha256:${sha256Hex(canonicalBytes(input))}`, fileDigests };
}
