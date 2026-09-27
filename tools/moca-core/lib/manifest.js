// Manifest checks beyond the JSON Schema. See spec/moca-package-spec.md §4.
import { validateAgainst } from './schemas.js';

export const MANIFEST_KEYS = new Set([
  '$schema', 'mocaVersion', 'id', 'version', 'title', 'description', 'language', 'locales', 'license',
  'publisher', 'validFrom', 'validUntil', 'members', 'relations', 'profiles',
]);

// URN namespaces registered with IANA that are commonly used as package ids.
// Not exhaustive: M007 is informational.
const REGISTERED_URN_NIDS = new Set(['uuid', 'oid', 'isbn', 'issn', 'ietf', 'publicid', 'nbn', 'doi', 'lex', 'mpeg', 'iso']);

/**
 * @param {object} manifest
 * @param {import('./diagnostics.js').Diagnostics} diagnostics
 * @param {{ knownProfiles?: Iterable<string> }} [options]
 */
export function checkManifest(manifest, diagnostics, { knownProfiles = [] } = {}) {
  const file = 'moca.json';
  for (const err of validateAgainst('manifest', manifest)) {
    diagnostics.add('M002_MANIFEST_SCHEMA', err, { file });
  }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return;

  for (const key of Object.keys(manifest)) {
    if (!MANIFEST_KEYS.has(key) && !/^x-[a-z0-9]+-[A-Za-z0-9-]+$/.test(key)) {
      diagnostics.add('M004_UNKNOWN_KEY', `"${key}" is not a MOCA manifest key; it is ignored. Vendor keys use x-<vendor>-<key>.`, { file });
    }
  }

  const seen = new Set();
  for (const m of Array.isArray(manifest.members) ? manifest.members : []) {
    if (!m?.id) continue;
    if (seen.has(m.id)) diagnostics.add('M005_DUPLICATE_MEMBER', `member ${m.id} is listed more than once`, { file });
    seen.add(m.id);
  }

  const from = Date.parse(manifest.validFrom);
  const until = Date.parse(manifest.validUntil);
  if (!Number.isNaN(from) && !Number.isNaN(until) && until <= from) {
    diagnostics.add('M006_VALIDITY_WINDOW_INVALID', 'validUntil must be later than validFrom', { file });
  }

  const urn = typeof manifest.id === 'string' ? manifest.id.match(/^urn:([^:]+):/i) : null;
  if (urn && !REGISTERED_URN_NIDS.has(urn[1].toLowerCase())) {
    diagnostics.add('M007_UNREGISTERED_URN', `"urn:${urn[1]}:" is not a registered URN namespace (RFC 8141); prefer an https: or tag: URI`, { file });
  }

  const known = new Set(knownProfiles);
  for (const uri of Object.keys(manifest.profiles ?? {})) {
    if (!known.has(uri)) diagnostics.add('F001_PROFILE_UNRECOGNISED', `profile ${uri} is not recognised; its data is preserved but not interpreted`, { file });
  }
}
