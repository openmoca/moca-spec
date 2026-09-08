import { UsageError } from './target.js';

/**
 * Resolves the sidecar's target_package_hash from the target's own
 * declared canonicalDigest -- per spec/moca-sidecar-index-spec.md §4, the
 * preferred binding form. moca-index trusts the declared value; it does
 * not recompute it here (that would make the target's own canonicalDigest
 * moca-index's concern, not the target package's). lib/validate.js
 * separately re-derives the target's actual digest to confirm the declared
 * value is still accurate before the sidecar is written.
 *
 * @param {string} packageDir
 * @param {object} manifest
 * @param {{ allowUnbound?: boolean }} options
 * @returns {string|undefined} `sha256:<hex>`, or undefined for an
 *   explicitly unbound sidecar
 */
export function resolveTargetHash(packageDir, manifest, { allowUnbound = false } = {}) {
  if (manifest.composition?.members?.length) {
    throw new UsageError(
      `${packageDir} declares composition.members; moca-index does not yet support binding against a composed package. Build against a non-composed target.`
    );
  }

  if (typeof manifest.canonicalDigest?.value === 'string') {
    return `sha256:${manifest.canonicalDigest.value}`;
  }

  if (!allowUnbound) {
    throw new UsageError(
      `${packageDir}'s moca.json has no canonicalDigest; the sidecar can't be verified as synchronized with its target. Pass --allow-unbound to build anyway, or add a canonicalDigest to the target first (core §5.5).`
    );
  }

  return undefined;
}
