import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { walkFiles } from './walk.js';

/**
 * V1 chunking strategy: one chunk per content file (whole-node addressing,
 * chunking.strategy: "node_level" in the emitted manifest). Alternate
 * strategies (paragraph, fixed-token-sliding) are a documented future
 * extension point, not implemented here.
 *
 * @param {string} packageDir
 * @returns {Array<{ content_path: string, chunk_index: 0, chunk_count: 1, text: string }>}
 */
export function buildChunks(packageDir) {
  const contentDir = join(packageDir, 'content');
  const files = walkFiles(contentDir).filter((f) => f.endsWith('.md'));

  return files.map((relPath) => {
    const raw = readFileSync(join(contentDir, relPath), 'utf8').replace(/\r\n/g, '\n');
    const { content } = matter(raw);
    return {
      content_path: relPath,
      chunk_index: 0,
      chunk_count: 1,
      text: content.trim(),
    };
  });
}
