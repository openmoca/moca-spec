// The search entry point: spec/moca-reader-contract.md §9.2.
// Backends only find candidate hits. Every hit is resolved through the
// library and re-checked against the default retrieval policy, the host's
// audience set, the caller's locale and concepts, whatever the backend did.
import { citationFor, passesDefaultPolicy, pickRepresentation } from './citation.js';

const MAX_FETCH = 200;

/**
 * @typedef {object} SearchHit  schemas/v1/search-hit.schema.json
 * @property {string} digest
 * @property {string} node
 * @property {string} path
 * @property {string} [locale]
 * @property {{ start: number, end: number }} [span]
 * @property {number} score
 *
 * @typedef {object} SearchFilters  spec/moca-reader-contract.md §9.5
 * @property {string[]} digests
 * @property {Array<{ digest: string, node: string }>} exclude
 * @property {string[]} [audiences]
 * @property {string} [locale]
 * @property {string[]} [concepts]
 *
 * @typedef {object} SearchBackend
 * @property {string[]} features  lexical | dense | hybrid | filterPushdown
 * @property {(query: string, options: { limit: number, filters: SearchFilters }) => SearchHit[]|Promise<SearchHit[]>} search
 * @property {object[]} [diagnostics]
 *
 * @typedef {object} Embedder  supplied by the host, never by a package
 * @property {string} name
 * @property {string} [version]
 * @property {number} dimensions
 * @property {(texts: string[]) => number[][]|Promise<number[][]>} embed
 *
 * @typedef {object} SearchOptions
 * @property {number} [limit]         default 5
 * @property {boolean} [includeAll]   the host's opt-in to content §8 excludes
 * @property {string} [locale]
 * @property {string[]} [concepts]    ontology profile concept IRIs
 */

export class Search {
  /**
   * @param {import('./library.js').Library} library
   * @param {{ backend: SearchBackend, audiences?: string[], overfetch?: number }} options
   */
  constructor(library, { backend, audiences, overfetch = 3 }) {
    if (!backend || typeof backend.search !== 'function') throw new TypeError('Search needs a backend');
    this.library = library;
    this.backend = backend;
    this.audiences = audiences ? [...audiences] : undefined;
    this.overfetch = overfetch;
  }

  /**
   * @param {string} query
   * @param {SearchOptions} [options]
   */
  async search(query, options = {}) {
    const { request, context } = this.#plan(options);
    return this.#resolve(await this.backend.search(query, request), context);
  }

  /** As search(), for a backend whose search is synchronous. */
  searchSync(query, options = {}) {
    const { request, context } = this.#plan(options);
    const hits = this.backend.search(query, request);
    if (typeof hits?.then === 'function') throw new TypeError('this backend is asynchronous; use search()');
    return this.#resolve(hits, context);
  }

  #plan({ limit = 5, includeAll = false, locale, concepts } = {}) {
    const index = this.library.relationIndex();
    const now = this.library.clock();
    const exclude = [];
    if (!includeAll) {
      for (const { result } of this.library.packages) {
        for (const node of result.nodes) {
          const allExcluded = node.representations.every((rep) => !passesDefaultPolicy(citationFor(result, node, rep, { now, index })));
          if (allExcluded) exclude.push({ digest: result.digest, node: `${result.manifest.id}#${node.path}` });
        }
      }
    }
    const filters = {
      digests: this.library.packages.map((p) => p.result.digest),
      exclude,
      ...(this.audiences ? { audiences: this.audiences } : {}),
      ...(locale ? { locale } : {}),
      ...(concepts?.length ? { concepts: [...concepts] } : {}),
    };
    const pushdown = this.backend.features?.includes('filterPushdown');
    const fetch = pushdown ? limit : Math.min(limit * this.overfetch, MAX_FETCH);
    return { request: { limit: fetch, filters }, context: { limit, includeAll, locale, concepts, index, now } };
  }

  #resolve(hits, { limit, includeAll, locale, concepts, index, now }) {
    const loaded = new Map(this.library.packages.map((p) => [p.result.digest, p.result]));
    const out = [];
    for (const hit of Array.isArray(hits) ? hits : []) {
      const result = loaded.get(hit?.digest);
      if (!result) continue;
      if (hit.node !== `${result.manifest.id}#${hit.path}`) continue;
      const node = result.nodes.find((n) => n.path === hit.path);
      const rep = node?.representations.find((r) => (r.locale ?? null) === (hit.locale ?? null));
      if (!rep) continue;
      if (locale && pickRepresentation(node, locale) !== rep) continue;
      const text = hit.span ? sliceBody(rep, hit.span) : rep.body;
      if (text === null) continue;
      const record = citationFor(result, node, rep, { now, index, text });
      if (hit.span) record.span = { start: hit.span.start, end: hit.span.end };
      if (!includeAll && !passesDefaultPolicy(record)) continue;
      if (this.audiences && record.audience && !this.audiences.includes(record.audience)) continue;
      if (concepts?.length && !(record.concepts ?? []).some((c) => concepts.includes(c))) continue;
      out.push({ ...record, score: hit.score });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

/** The text of a byte span that lies inside a representation's body, or null. */
function sliceBody(rep, { start, end }) {
  const body = Buffer.from(rep.body, 'utf8');
  const from = start - rep.bodyOffset;
  const to = end - rep.bodyOffset;
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < from || to > body.length) return null;
  return body.subarray(from, to).toString('utf8');
}
