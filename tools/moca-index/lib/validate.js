import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { resolvePackagePath } from '@openmoca/moca-lint/lib/paths.js';
import { computeCanonicalDigest } from '@openmoca/moca-sign/lib/canonical-digest.js';

// The schema is vendored into this package rather than read from the
// repository, so the published package is self-contained. A published tarball
// contains only bin/, lib/ and README.md -- reading ../../../schemas/ worked
// in the workspace and failed for anyone who installed it.
// scripts/check-vendored-schema.mjs asserts this copy matches
// schemas/v1/core/sidecar-index.schema.json.
const schemaPath = join(dirname(fileURLToPath(import.meta.url)), 'sidecar-index.schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

/**
 * moca-index's own fail-closed gate: schema conformance, the
 * chunk_index/chunk_count addressing invariant with content_path resolving
 * safely under the target's content/, and (when bound) that
 * target_package_hash still matches the target's actual computed
 * canonicalDigest. This is deliberately independent of
 * scripts/validate-sidecar-index.mjs (which is written for scanning
 * examples/sidecars/*, not for validating one freshly-built sidecar) --
 * the digest computation itself is reused via computeCanonicalDigest, not
 * reimplemented.
 *
 * @param {object} params
 * @param {object} params.indexManifest
 * @param {object[]} params.payloadItems
 * @param {string} params.targetDir
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSidecar({ indexManifest, payloadItems, targetDir }) {
  const errors = [];

  if (!validateSchema(indexManifest)) {
    for (const err of validateSchema.errors ?? []) {
      errors.push(`index.json: ${err.instancePath || '/'} ${err.message}`);
    }
  }

  for (const [index, item] of payloadItems.entries()) {
    const { content_path: contentPath, chunk_index: chunkIndex, chunk_count: chunkCount } = item;

    if (!(Number.isInteger(chunkIndex) && Number.isInteger(chunkCount) && chunkIndex >= 0 && chunkIndex < chunkCount)) {
      errors.push(
        `payload item ${index}: violates 0 <= chunk_index < chunk_count (chunk_index=${chunkIndex}, chunk_count=${chunkCount})`
      );
      continue;
    }

    const resolved = resolvePackagePath(targetDir, join('content', contentPath ?? ''), ['content']);
    if (!resolved || !existsSync(resolved)) {
      errors.push(`payload item ${index}: content_path "${contentPath}" does not resolve under the target's content/`);
    }
  }

  if (indexManifest.target_package_hash) {
    const declared = indexManifest.target_package_hash.replace(/^sha256:/, '');
    let actual;
    try {
      actual = computeCanonicalDigest(targetDir);
    } catch (err) {
      errors.push(`could not recompute the target's canonicalDigest to verify target_package_hash: ${err.message}`);
      actual = null;
    }
    if (actual !== null && declared !== actual) {
      errors.push(`target_package_hash mismatch: declared ${declared}, computed ${actual}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
