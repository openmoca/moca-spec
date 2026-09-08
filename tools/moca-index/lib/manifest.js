/**
 * Builds the index.json manifest object per
 * schemas/core/sidecar-index.schema.json. `item_addressing` is always this
 * exact fixed object -- the schema declares each of its three properties as
 * a `const`, so it isn't actually configurable.
 *
 * @param {{ targetId: string, targetHash?: string }} params
 * @returns {object}
 */
export function buildIndexManifest({ targetId, targetHash }) {
  return {
    manifest_version: '1.0.0',
    target_package_id: targetId,
    ...(targetHash ? { target_package_hash: targetHash } : {}),
    index_type: 'content_addressing_only',
    chunking: { strategy: 'node_level' },
    item_addressing: {
      content_path: 'content_path',
      chunk_index: 'chunk_index',
      chunk_count: 'chunk_count',
    },
    storage: {
      format: 'jsonl',
      file: 'payload/index.jsonl',
    },
  };
}
