import { readTargetManifest, UsageError } from './target.js';
import { resolveTargetHash } from './bind.js';
import { buildChunks } from './chunk.js';
import { buildIndexManifest } from './manifest.js';

const IMPLEMENTED_EMBEDDERS = new Set(['none']);

/**
 * Builds an in-memory sidecar draft (index.json object + payload items)
 * from a target package directory. Never touches the output location --
 * lib/write.js owns writing and the fail-closed self-validation gate.
 *
 * @param {object} params
 * @param {string} params.targetDir
 * @param {{ allowUnbound?: boolean, embedder?: string }} params.options
 * @returns {{ indexManifest: object, payloadItems: object[] }}
 */
export function buildSidecar({ targetDir, options = {} }) {
  const embedder = options.embedder ?? 'none';
  if (!IMPLEMENTED_EMBEDDERS.has(embedder)) {
    throw new UsageError(
      `Unknown --embedder "${embedder}"; only "none" (lexical-only) is implemented so far.`
    );
  }

  const manifest = readTargetManifest(targetDir);
  const targetHash = resolveTargetHash(targetDir, manifest, { allowUnbound: options.allowUnbound });

  const payloadItems = buildChunks(targetDir);
  if (payloadItems.length === 0) {
    throw new UsageError(`No content files found under ${targetDir}/content; nothing to index.`);
  }

  const indexManifest = buildIndexManifest({ targetId: manifest.id, targetHash });

  return { indexManifest, payloadItems };
}
