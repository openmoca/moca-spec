// Generic profile schema discovery (core §10) — resolves a profile URI to a
// schema at schemas/<profileName>/profile.schema.json by convention, so
// adding a new profile doesn't require code changes here, only that file.
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));
export const repoRoot = join(packageDir, '..', '..');

const schemaCache = new Map();

/**
 * Derives a profile's short name from its declaration URI, e.g.
 * "https://openmoca.org/profiles/education/v1" -> "education".
 * @param {string} profileUri
 * @returns {string|null}
 */
export function deriveProfileName(profileUri) {
  try {
    const segments = new URL(profileUri).pathname.split('/').filter(Boolean);
    const profilesIndex = segments.indexOf('profiles');
    if (profilesIndex === -1 || !segments[profilesIndex + 1]) return null;
    return segments[profilesIndex + 1];
  } catch {
    return null;
  }
}

/**
 * Loads schemas/<profileName>/profile.schema.json if it exists, by convention.
 * @param {string} profileName
 * @param {string} [schemasRoot] - override for testing
 * @returns {object|null} parsed schema, or null if no schema is published for this profile
 */
export function loadProfileSchema(profileName, schemasRoot = join(repoRoot, 'schemas')) {
  const cacheKey = `${schemasRoot}::${profileName}`;
  if (schemaCache.has(cacheKey)) return schemaCache.get(cacheKey);

  const schemaPath = join(schemasRoot, profileName, 'profile.schema.json');
  const schema = existsSync(schemaPath) ? JSON.parse(readFileSync(schemaPath, 'utf8')) : null;
  schemaCache.set(cacheKey, schema);
  return schema;
}

/** @param {object} manifest @returns {string[]} profile names derived from manifest.profile */
export function activeProfileNames(manifest) {
  return (manifest.profile ?? [])
    .map((uri) => deriveProfileName(uri))
    .filter((name) => name !== null);
}
