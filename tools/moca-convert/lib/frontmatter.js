// Shared frontmatter read/reserialize helper used by every adapter that
// converts an existing Markdown file into a content node: preserve
// frontmatter verbatim when present, and never add an empty frontmatter
// block to a file that didn't have one.
import { readFileSync } from 'node:fs';
import matter from 'gray-matter';

/**
 * @param {string} absPath
 * @returns {{ data: object, content: string, body: string }}
 *   `data` is the parsed frontmatter object (empty if none), `content` is
 *   the Markdown body without frontmatter, and `body` is the full
 *   re-serialized file contents (frontmatter block + body, or just the body
 *   when there was no frontmatter to begin with).
 */
export function readContentFile(absPath) {
  const raw = readFileSync(absPath, 'utf8').replace(/\r\n/g, '\n');
  const parsed = matter(raw);
  const data = parsed.data ?? {};
  const hasFrontmatter = Object.keys(data).length > 0;
  const body = hasFrontmatter ? matter.stringify(parsed.content, data) : parsed.content;
  return { data, content: parsed.content, body };
}
