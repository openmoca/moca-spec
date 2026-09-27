// Dense backend over sidecar vectors: spec/moca-reader-contract.md §9.3.
// The host supplies the embedder. A sidecar whose model does not match it is
// reported (S006) and its vectors are not searched.
import { Diagnostics } from '../diagnostics.js';
import { pickRepresentation } from '../citation.js';

export class DenseBackend {
  /**
   * @param {import('../library.js').Library} library
   * @param {{ embedder: import('../search.js').Embedder }} options
   */
  constructor(library, { embedder }) {
    if (!embedder || typeof embedder.embed !== 'function') throw new TypeError('DenseBackend needs a host embedder');
    this.library = library;
    this.embedder = embedder;
    this.features = ['dense', 'filterPushdown'];
    this.checks = new Diagnostics();
    this.diagnostics = this.checks.items;
    this.checked = new Map();
    this.#check();
  }

  /** @returns {Promise<import('../search.js').SearchHit[]>} */
  async search(query, { limit, filters }) {
    this.#check();
    const usable = this.library.packages.filter((p) => this.checked.get(p.result.digest) && (!filters.digests || filters.digests.includes(p.result.digest)));
    if (usable.length === 0) return [];
    const [q] = await this.embedder.embed([query]);
    const excluded = new Set((filters.exclude ?? []).map((x) => `${x.digest} ${x.node}`));
    const scored = [];
    for (const { result, chunks } of usable) {
      const byPath = new Map(result.nodes.map((n) => [n.path, n]));
      for (const c of chunks) {
        const node = byPath.get(c.path);
        const rep = node?.representations.find((r) => (r.locale ?? null) === (c.locale ?? null));
        if (!rep || !Array.isArray(c.vector)) continue;
        const id = `${result.manifest.id}#${node.path}`;
        if (excluded.has(`${result.digest} ${id}`)) continue;
        if (filters.locale && pickRepresentation(node, filters.locale) !== rep) continue;
        const audience = rep.frontmatter.moca?.audience;
        if (filters.audiences && typeof audience === 'string' && !filters.audiences.includes(audience)) continue;
        if (filters.concepts && !(rep.concepts ?? []).some((x) => filters.concepts.includes(x))) continue;
        scored.push({
          digest: result.digest, node: id, path: node.path, ...(rep.locale ? { locale: rep.locale } : {}),
          span: { start: c.start, end: c.end }, score: Math.round(cosine(q, c.vector) * 1e4) / 1e4,
        });
      }
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /** Compares the embedder with each loaded sidecar's model once per package digest. */
  #check() {
    for (const { result, chunks, index } of this.library.packages) {
      if (this.checked.has(result.digest)) continue;
      const vectors = (chunks ?? []).filter((c) => Array.isArray(c.vector));
      if (!index || vectors.length === 0) {
        this.checked.set(result.digest, false);
        continue;
      }
      const problem = modelMismatch(this.embedder, index.model, vectors[0].vector.length);
      if (problem) this.checks.add('S006_MODEL_MISMATCH', `${result.manifest.id}@${result.manifest.version}: ${problem}`);
      this.checked.set(result.digest, !problem);
    }
  }
}

/** @returns {string|null} why the embedder cannot search vectors made by `model` */
export function modelMismatch(embedder, model, vectorLength) {
  if (!model?.name) return 'the index names no model';
  if (model.name !== embedder.name) return `index model "${model.name}" is not the host embedder "${embedder.name}"`;
  if (model.version && embedder.version && model.version !== embedder.version) return `index model version ${model.version} is not ${embedder.version}`;
  const dims = model.dimensions ?? vectorLength;
  if (dims !== embedder.dimensions) return `index has ${dims} dimensions; the host embedder has ${embedder.dimensions}`;
  return null;
}

export function cosine(a, b) {
  if (!Array.isArray(a) || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
}
