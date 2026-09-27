// `directory` adapter: a folder of Markdown files (optionally nested) becomes
// one content node per file, at the same path under content/.
import { existsSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { walkFiles } from '../walk.js';
import { readContentFile, ensureOkf, deriveTitle } from '../frontmatter.js';
import { buildManifest } from '../manifest.js';
import { UsageError } from '../target.js';

export const name = 'directory';
export const DEFAULT_TYPE = 'Document';

/** @param {string} inputPath */
export function detect(inputPath) {
  if (!existsSync(inputPath) || !statSync(inputPath).isDirectory()) return false;
  return walkFiles(inputPath).some((f) => f.endsWith('.md'));
}

/**
 * @param {{ inputPath: string, options: object }} ctx
 * @returns {import('./index.js').PackageDraft}
 */
export function convert({ inputPath, options }) {
  const manifest = buildManifest(options);
  const files = walkFiles(inputPath).filter((f) => f.endsWith('.md'));
  if (files.length === 0) throw new UsageError(`No Markdown files found under ${inputPath}.`);
  const type = options.type ?? DEFAULT_TYPE;
  const contentNodes = files.map((relPath) => {
    const { data, content, raw } = readContentFile(join(inputPath, relPath));
    const title = deriveTitle(data, content, basename(relPath, extname(relPath)));
    return { path: `content/${relPath}`, body: ensureOkf(raw, data, { type, title }) };
  });
  return { manifest, contentNodes, warnings: [] };
}
