// Auto-detection of --from when the caller doesn't pass it explicitly.
// Ambiguous input is always a refusal (UsageError, mapped to exit code 2 by
// the CLI) -- this module never guesses.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { UsageError } from './target.js';
import { walkFiles } from './walk.js';
import { ADAPTER_NAMES, getAdapter } from './adapters/index.js';

const OPENAPI_JSON_YAML_EXT = new Set(['.json', '.yaml', '.yml']);

/**
 * @param {import('./target.js').UsageError | { inputPath: string, isGlob: boolean, isDirectory: boolean, isFile: boolean }} target
 * @param {string} [explicitFrom]
 * @returns {string} one of ADAPTER_NAMES
 */
export function resolveAdapterName(target, explicitFrom) {
  if (explicitFrom) {
    if (!ADAPTER_NAMES.includes(explicitFrom)) {
      throw new UsageError(`Unknown --from "${explicitFrom}"; expected one of: ${ADAPTER_NAMES.join(', ')}.`);
    }
    return explicitFrom;
  }

  if (target.isGlob) {
    throw new UsageError(
      `"${target.inputPath}" looks like a glob pattern; auto-detection only supports a single file or directory. Pass --from markdown explicitly.`
    );
  }

  if (target.isDirectory) {
    return detectDirectory(target.inputPath);
  }

  if (target.isFile) {
    return detectFile(target.inputPath);
  }

  throw new UsageError(`Cannot determine input format for "${target.inputPath}".`);
}

function detectDirectory(inputPath) {
  if (existsSync(join(inputPath, '.obsidian')) && statSync(join(inputPath, '.obsidian')).isDirectory()) {
    return 'obsidian';
  }

  // "Has at least one Markdown file anywhere" is the same test the
  // directory adapter's own detect() runs; it's inlined here (rather than
  // calling it separately) because the file list and count are also needed
  // below for the ambiguity/refusal messages.
  const allFiles = walkFiles(inputPath);
  const markdownFiles = allFiles.filter((f) => f.endsWith('.md'));
  const topLevelOpenApiCandidates = allFiles.filter(
    (f) => !f.includes('/') && OPENAPI_JSON_YAML_EXT.has(extname(f)) && looksLikeOpenApi(readSafely(join(inputPath, f)))
  );

  if (markdownFiles.length > 0 && topLevelOpenApiCandidates.length > 0) {
    throw new UsageError(
      `Cannot determine input format for "${inputPath}": found ${markdownFiles.length} Markdown file(s) and an OpenAPI-shaped document ("${topLevelOpenApiCandidates[0]}"). Pass --from explicitly.`
    );
  }

  if (topLevelOpenApiCandidates.length > 0 && markdownFiles.length === 0) {
    return 'openapi';
  }

  if (markdownFiles.length > 0) {
    return 'directory';
  }

  throw new UsageError(
    `Cannot determine input format for "${inputPath}": no Markdown files and no recognizable OpenAPI document found. Pass --from explicitly.`
  );
}

function detectFile(inputPath) {
  if (getAdapter('markdown').detect(inputPath)) {
    return 'markdown';
  }

  const ext = extname(inputPath);
  if (OPENAPI_JSON_YAML_EXT.has(ext)) {
    const content = readSafely(inputPath);
    if (looksLikeSwagger(content)) {
      throw new UsageError(
        `"${inputPath}" is an OpenAPI 2.0 (Swagger) document; only OpenAPI 3.x is supported.`
      );
    }
    if (looksLikeOpenApi(content)) {
      return 'openapi';
    }
    throw new UsageError(
      `"${inputPath}" is JSON/YAML but not a recognizable OpenAPI document. Pass --from explicitly.`
    );
  }

  throw new UsageError(
    `Cannot determine input format for "${inputPath}"; expected one of: ${ADAPTER_NAMES.join(', ')}. Pass --from explicitly.`
  );
}

/**
 * Cheap textual sniff for a top-level `openapi: 3.x` key, used only for
 * detection. The openapi adapter itself parses the document properly
 * (JSON.parse / js-yaml) rather than relying on this heuristic.
 * @param {string} content
 */
export function looksLikeOpenApi(content) {
  return /^openapi\s*:\s*["']?3\.\d+\.\d+/m.test(content) || /"openapi"\s*:\s*"3\.\d+\.\d+"/.test(content);
}

/** @param {string} content */
export function looksLikeSwagger(content) {
  return /^swagger\s*:\s*["']?2\.\d+/m.test(content) || /"swagger"\s*:\s*"2\.\d+"/.test(content);
}

function extname(p) {
  const idx = p.lastIndexOf('.');
  return idx === -1 ? '' : p.slice(idx).toLowerCase();
}

function readSafely(absPath) {
  try {
    return readFileSync(absPath, 'utf8');
  } catch {
    return '';
  }
}
