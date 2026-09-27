// YAML frontmatter for OKF concept documents.
//
// Parsed with the YAML core schema, so timestamps stay strings exactly as
// written: a reader must never reinterpret `2026-08-14` as a local-time Date.
import * as yaml from 'js-yaml';

const OPEN = /^---[ \t]*\r?\n/;
const CLOSE = /^---[ \t]*(\r?\n|$)/m;

/**
 * @param {string} text  full file text
 * @returns {{ present: boolean, raw?: string, data?: any, error?: string, body: string, bodyOffset: number, line: number }}
 *   bodyOffset is the UTF-8 byte offset where the Markdown body starts.
 */
export function splitFrontmatter(text) {
  const bom = text.startsWith('﻿') ? '﻿' : '';
  const rest = text.slice(bom.length);
  const open = rest.match(OPEN);
  if (!open) return { present: false, body: text, bodyOffset: Buffer.byteLength(bom), line: 1 };
  const afterOpen = rest.slice(open[0].length);
  const close = afterOpen.match(CLOSE);
  if (!close) {
    return { present: true, error: 'frontmatter block is not closed with ---', body: text, bodyOffset: 0, line: 1 };
  }
  const raw = afterOpen.slice(0, close.index);
  const consumed = bom + open[0] + afterOpen.slice(0, close.index + close[0].length);
  const body = text.slice(consumed.length);
  const result = { present: true, raw, body, bodyOffset: Buffer.byteLength(consumed), line: 1 };
  try {
    result.data = raw.trim() === '' ? {} : yaml.load(raw, { schema: yaml.CORE_SCHEMA });
  } catch (err) {
    result.error = err.reason ?? err.message;
    if (err.mark?.line !== undefined) result.line = err.mark.line + 2;
    return result;
  }
  if (result.data === null || typeof result.data !== 'object' || Array.isArray(result.data)) {
    result.error = 'frontmatter is not a YAML mapping';
  }
  return result;
}

/**
 * Serialises a frontmatter mapping plus body. Key order is preserved.
 * @param {object} data
 * @param {string} body
 */
export function joinFrontmatter(data, body) {
  const dumped = yaml.dump(data, { schema: yaml.CORE_SCHEMA, lineWidth: -1, noRefs: true, quotingType: '"' });
  return `---\n${dumped}---\n${body.startsWith('\n') ? body.slice(1) : body}`;
}

/**
 * Adds keys to the top of an existing frontmatter block without touching the
 * rest of it, so an author's formatting and comments survive. Used by
 * converters to supply an OKF `type` a source file lacks.
 *
 * @param {string} text  full file text
 * @param {object} additions
 */
export function prependFrontmatterKeys(text, additions) {
  const lines = yaml.dump(additions, { schema: yaml.CORE_SCHEMA, lineWidth: -1, quotingType: '"' });
  const split = splitFrontmatter(text);
  if (!split.present) return `---\n${lines}---\n\n${text.replace(/^\n+/, '')}`;
  const open = text.match(/^﻿?---[ \t]*\r?\n/)[0];
  return `${open}${lines}${text.slice(open.length)}`;
}
