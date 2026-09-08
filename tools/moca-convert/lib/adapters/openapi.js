// `openapi` adapter: a "suitable" OpenAPI 3.x document (JSON or YAML) --
// one whose operations carry real summary/description text -- becomes one
// content node per operation (default) or per tag (--chunker tag).
import { existsSync, statSync } from 'node:fs';
import { UsageError } from '../target.js';
import { parseOpenApiDocument, collectOperations } from './openapi/parse.js';
import { checkSuitability, DEFAULT_MIN_DESCRIPTION_RATIO } from './openapi/suitability.js';
import { renderOperationNode, renderTagNode } from './openapi/render.js';

export const name = 'openapi';

const OPENAPI_FILE_EXT = /\.(json|ya?ml)$/i;
const CHUNKER_MODES = ['operation', 'tag'];

/**
 * @param {string} inputPath
 * @returns {boolean} true for a single JSON/YAML file that parses as an
 *   OpenAPI 3.x document.
 */
export function detect(inputPath) {
  if (!existsSync(inputPath) || !statSync(inputPath).isFile()) return false;
  if (!OPENAPI_FILE_EXT.test(inputPath)) return false;
  try {
    parseOpenApiDocument(inputPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {object} ctx
 * @param {string} ctx.inputPath
 * @param {{ id?: string, title?: string, version?: string, minDescriptionRatio?: number, chunker?: string }} ctx.options
 * @returns {import('./index.js').PackageDraft}
 */
export function convert({ inputPath, options }) {
  if (!options.id) {
    throw new UsageError('--id is required for the openapi adapter.');
  }

  const chunker = options.chunker ?? 'operation';
  if (!CHUNKER_MODES.includes(chunker)) {
    throw new UsageError(`Unknown --chunker "${chunker}"; expected one of: ${CHUNKER_MODES.join(', ')}.`);
  }

  const doc = parseOpenApiDocument(inputPath);

  const minRatio = options.minDescriptionRatio ?? DEFAULT_MIN_DESCRIPTION_RATIO;
  const suitability = checkSuitability(doc, minRatio);
  if (!suitability.suitable) {
    throw new UsageError(`"${inputPath}" is not suitable for conversion: ${suitability.reason}`);
  }

  const title = options.title ?? (typeof doc.info?.title === 'string' ? doc.info.title : undefined);
  if (!title) {
    throw new UsageError(`"${inputPath}" has no "info.title" and no --title was given.`);
  }

  const operations = collectOperations(doc);
  const contentNodes = chunker === 'tag' ? buildTagNodes(operations, doc) : buildOperationNodes(operations, doc);

  const description = typeof doc.info?.description === 'string' ? doc.info.description.trim() : '';

  const manifest = {
    id: options.id,
    version: options.version ?? '1.0.0',
    title,
    ...(description ? { description } : {}),
  };

  return { manifest, contentNodes, warnings: [] };
}

function buildOperationNodes(operations, doc) {
  return operations.map(({ path, method, operation }) => renderOperationNode(path, method, operation, doc));
}

function buildTagNodes(operations, doc) {
  const groups = new Map();
  for (const entry of operations) {
    const tag = entry.operation.tags?.[0] ?? 'Untagged';
    if (!groups.has(tag)) groups.set(tag, []);
    groups.get(tag).push(entry);
  }
  return [...groups.keys()].sort().map((tag) => renderTagNode(tag, groups.get(tag), doc));
}
