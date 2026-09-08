// `directory` adapter: a folder of Markdown files (optionally nested) becomes
// one content node per file, at the corresponding path under content/.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { walkFiles } from '../walk.js';
import { UsageError } from '../target.js';

export const name = 'directory';

/**
 * @param {string} inputPath
 * @returns {boolean} true if `inputPath` is a directory containing at least
 *   one Markdown file anywhere in its tree.
 */
export function detect(inputPath) {
  if (!existsSync(inputPath) || !statSync(inputPath).isDirectory()) return false;
  return walkFiles(inputPath).some((f) => f.endsWith('.md'));
}

/**
 * @param {object} ctx
 * @param {string} ctx.inputPath
 * @param {{ id?: string, title?: string, version?: string }} ctx.options
 * @returns {import('./index.js').PackageDraft}
 */
export function convert({ inputPath, options }) {
  if (!options.id) {
    throw new UsageError('--id is required for the directory adapter.');
  }
  if (!options.title) {
    throw new UsageError('--title is required for the directory adapter.');
  }

  const files = walkFiles(inputPath).filter((f) => f.endsWith('.md'));
  if (files.length === 0) {
    throw new UsageError(`No Markdown files found under ${inputPath}.`);
  }

  const contentNodes = files.map((relPath) => buildContentNode(inputPath, relPath));

  const manifest = {
    id: options.id,
    version: options.version ?? '1.0.0',
    title: options.title,
  };

  return { manifest, contentNodes, warnings: [] };
}

function buildContentNode(inputPath, relPath) {
  const raw = readFileSync(join(inputPath, relPath), 'utf8').replace(/\r\n/g, '\n');
  const parsed = matter(raw);
  const hasFrontmatter = Object.keys(parsed.data ?? {}).length > 0;
  const body = hasFrontmatter ? matter.stringify(parsed.content, parsed.data) : parsed.content;
  return { path: `content/${relPath}`, body };
}
