import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export class UsageError extends Error {}

/**
 * Reads and minimally validates the target package's manifest -- just
 * enough to build a sidecar against it. Full package validity is
 * moca-lint's job, not moca-index's; a target that fails moca-lint can
 * still be indexed (the sidecar itself is what gets fail-closed gated, in
 * lib/write.js).
 *
 * @param {string} packageDir
 * @returns {object} the parsed moca.json
 */
export function readTargetManifest(packageDir) {
  if (!existsSync(packageDir) || !statSync(packageDir).isDirectory()) {
    throw new UsageError(`Target is not a directory: ${packageDir}`);
  }

  const manifestPath = join(packageDir, 'moca.json');
  if (!existsSync(manifestPath)) {
    throw new UsageError(`No moca.json found under ${packageDir}`);
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    throw new UsageError(`${manifestPath} is not valid JSON: ${err.message}`);
  }

  if (typeof manifest.id !== 'string' || manifest.id.length === 0) {
    throw new UsageError(`${manifestPath} has no "id"`);
  }

  return manifest;
}
