// @openmoca/moca-index: builds moca-jsonl-v1 sidecar indexes
// (spec/moca-sidecar-index-spec.md): chunks with byte offsets and text, and,
// when the host supplies an embedder, a `vector` per item and the embedder's
// `model` in index.json (a hybrid sidecar).
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import AdmZip from 'adm-zip';
import { readPackage, bindSidecar, PORTABLE_FORMAT } from '@openmoca/moca-core';

export class IndexError extends Error {}

export const CHUNKERS = ['node', 'headings'];

/**
 * Splits a representation's body into chunks at level 1-3 headings, or keeps
 * it whole. Offsets are UTF-8 byte offsets into the node file.
 */
export function chunkRepresentation(rep, chunker) {
  const whole = [{ start: rep.bodyOffset, end: rep.bodyOffset + Buffer.byteLength(rep.body), text: rep.body }];
  if (chunker === 'node') return whole;
  const lines = rep.body.split(/(?<=\n)/);
  const chunks = [];
  let current = '';
  let offset = rep.bodyOffset;
  let start = offset;
  let fence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (!fence && /^#{1,3}\s/.test(line) && current.trim() !== '') {
      chunks.push({ start, end: offset, text: current });
      current = '';
      start = offset;
    }
    current += line;
    offset += Buffer.byteLength(line);
  }
  if (current.trim() !== '' || chunks.length === 0) chunks.push({ start, end: offset, text: current });
  return chunks;
}

/**
 * @param {object} p
 * @param {string} p.pkg  package directory or .moca archive
 * @param {string} p.out  sidecar directory, or .zip file when zip is true
 * @param {boolean} [p.zip]
 * @param {'node'|'headings'} [p.chunker]
 * @param {boolean} [p.force]
 * @param {{ name: string, version?: string, dimensions: number, embed: (texts: string[]) => number[][]|Promise<number[][]> }} [p.embedder]
 */
export async function buildSidecar({ pkg, out, zip = false, chunker = 'node', force = false, embedder }) {
  if (!CHUNKERS.includes(chunker)) throw new IndexError(`unknown chunker "${chunker}"; use ${CHUNKERS.join(' or ')}`);
  const result = await readPackage(pkg);
  if (!result.valid) {
    const errors = result.diagnostics.filter((d) => d.severity === 'error').map((d) => `${d.code} ${d.message}`);
    throw new IndexError(`the package is not valid:\n  ${errors.join('\n  ')}`);
  }
  if (result.nodes.length === 0) throw new IndexError('the package has no content nodes to index');

  const items = [];
  for (const node of result.nodes) {
    for (const rep of node.representations) {
      const chunks = chunkRepresentation(rep, chunker);
      chunks.forEach((c, i) => {
        items.push({
          path: node.path,
          ...(rep.locale ? { locale: rep.locale } : {}),
          chunkIndex: i,
          chunkCount: chunks.length,
          start: c.start,
          end: c.end,
          text: c.text,
        });
      });
    }
  }
  if (embedder) {
    const vectors = await embedder.embed(items.map((i) => i.text));
    if (!Array.isArray(vectors) || vectors.length !== items.length || vectors.some((v) => !Array.isArray(v) || v.length !== embedder.dimensions)) {
      throw new IndexError(`the embedder must return one ${embedder.dimensions}-dimension vector per chunk`);
    }
    items.forEach((item, i) => { item.vector = vectors[i]; });
  }
  const index = {
    indexVersion: 1,
    target: { id: result.manifest.id, version: result.manifest.version, digest: result.digest },
    indexType: embedder ? 'hybrid' : 'lexical',
    ...(embedder ? { model: { name: embedder.name, ...(embedder.version ? { version: embedder.version } : {}), dimensions: embedder.dimensions } } : {}),
    chunking: { strategy: chunker === 'node' ? 'whole-node' : 'headings-h1-h3' },
    storage: { format: PORTABLE_FORMAT, file: 'payload/items.jsonl' },
    createdBy: 'moca-index',
  };
  const files = {
    'index.json': `${JSON.stringify(index, null, 2)}\n`,
    'payload/items.jsonl': `${items.map((i) => JSON.stringify(i)).join('\n')}\n`,
  };

  if (existsSync(out) && !force && (!zip ? readdirSync(out).length > 0 : true)) {
    throw new IndexError(`${out} already exists; pass --force to replace it`);
  }
  if (zip) {
    const archive = new AdmZip();
    for (const [name, text] of Object.entries(files)) archive.addFile(name, Buffer.from(text, 'utf8'));
    archive.writeZip(out);
  } else {
    rmSync(out, { recursive: true, force: true });
    mkdirSync(join(out, 'payload'), { recursive: true });
    for (const [name, text] of Object.entries(files)) writeFileSync(join(out, ...name.split('/')), text);
  }

  const check = bindSidecar(out, result);
  if (!check.usable) {
    rmSync(out, { recursive: true, force: true });
    throw new IndexError(`the built sidecar failed its own check: ${check.diagnostics.map((d) => d.message).join('; ')}`);
  }
  return { out, items: items.length, digest: result.digest };
}
